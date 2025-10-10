import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Refresh logic flags (simple, per-tab)
let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, token = null) => {
  pendingRequests.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  pendingRequests = [];
};

// Add response interceptor to handle auth errors and auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          pendingRequests.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      try {
        const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newAccess = resp.data?.accessToken;
        if (newAccess) {
          localStorage.setItem('authToken', newAccess);
        }
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccess;
        processQueue(null, newAccess);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('companyId');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const useCustomAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        const companyId = localStorage.getItem('companyId');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Set company ID in window for global access
          if (companyId) {
            window.companyId = parseInt(companyId);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('companyId');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, role, tenant, remember = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        rememberMe: remember
      });

      if ((response.data.accessToken || response.data.token) && response.data.user) {
        const accessToken = response.data.accessToken || response.data.token;
        const userData = response.data.user;
        
        // Store auth data
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Handle company ID
        if (userData.companyId) {
          localStorage.setItem('companyId', userData.companyId.toString());
          window.companyId = userData.companyId;
        }

        // Handle role validation
        if (role && role !== userData.role) {
          throw new Error('Role mismatch for this user');
        }

        // Handle tenant validation for non-developer users
        if (userData.role !== 'developer' && tenant && parseInt(tenant) !== userData.companyId) {
          throw new Error('Company mismatch for this user');
        }

        setUser(userData);
        return userData;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Admin/Developer: create a new user (requires auth token with admin/developer role)
  const register = async (email, password, role, companyId, name = null, phoneNumber = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/user/create', {
        email: email.trim().toLowerCase(),
        password,
        role,
        companyId,
        name,
        phoneNumber
      });

      if (response.data.user) {
        return response.data.user;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (err) {
      // Ignore logout errors, we'll clear local data anyway
      console.warn('Logout API call failed:', err);
    } finally {
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('companyId');
      localStorage.removeItem('rememberMe');
      
      // Clear window variables
      window.companyId = null;
      
      setUser(null);
      setError(null);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/user/change-password', {
        currentPassword,
        newPassword
      });

      return response.data.message;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Password change failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/user/reset-password', {
        userId,
        newPassword
      });

      return response.data.message;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Password reset failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async () => {
    try {
      const response = await apiClient.get('/user/profile');
      const userData = response.data;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('authToken');
  };

  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const isCompanyUser = (companyId) => {
    return user?.companyId === companyId || user?.role === 'developer';
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    changePassword,
    resetPassword,
    getProfile,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    isCompanyUser,
    apiClient // Export the configured axios instance for other components to use
  };
};

// Helper function to route by role
export const routeByRole = (navigate, role) => {
  const routes = {
    'developer': '/developer-dashboard',
    'admin': '/company-admin-dashboard',
    'driver': '/driver-dashboard',
    'booking_office': '/booking-office-dashboard',
    'boarding_operator': '/boarding-operator-dashboard',
    'operations_manager': '/operations-manager-dashboard',
    'maintenance_manager': '/maintenance-manager-dashboard',
    'finance_manager': '/finance-manager-dashboard',
    'hr_manager': '/hr-manager-dashboard',
    'depot_manager': '/depot-manager-dashboard'
  };

  const route = routes[role] || '/login';
  navigate(route);
};

// Helper function to set session from profile
export const setSessionFromProfile = (profile) => {
  if (profile) {
    localStorage.setItem('user', JSON.stringify(profile));
    if (profile.company_id) {
      localStorage.setItem('companyId', profile.company_id.toString());
      window.companyId = profile.company_id;
    }
  }
};
