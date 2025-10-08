import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, IconButton } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { createTheme } from '@mui/material/styles';
import ErrorBoundary from './components/common/ErrorBoundary';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import theme from './theme/theme';
import { supabase } from './supabase/client';
import './index.css';
import './styles/globalStyles.css';

// iOS-safe lazy loading with fallbacks
let DeveloperDashboard, CompanyAdminDashboard, OperationsManagerDashboard, BookingOfficeDashboard;
let BoardingOperatorDashboard, DriverDashboard, DepotManagerDashboard, MaintenanceManagerDashboard;
let FinanceDashboard, HRDashboard;

try {
  DeveloperDashboard = React.lazy(() => import('./pages/DeveloperDashboard/index'));
  CompanyAdminDashboard = React.lazy(() => import('./pages/CompanyAdminDashboard/index'));
  OperationsManagerDashboard = React.lazy(() => import('./pages/OperationsManagerDashboard/index'));
  BookingOfficeDashboard = React.lazy(() => import('./pages/BookingOfficeDashboard/index'));
  BoardingOperatorDashboard = React.lazy(() => import('./pages/BoardingOperatorDashboard/index'));
  DriverDashboard = React.lazy(() => import('./pages/DriverDashboard/index'));
  DepotManagerDashboard = React.lazy(() => import('./pages/DepotManagerDashboard/index'));
  MaintenanceManagerDashboard = React.lazy(() => import('./pages/MaintenanceManagerDashboard/index'));
  FinanceDashboard = React.lazy(() => import('./pages/FinanceDashboard/index'));
  HRDashboard = React.lazy(() => import('./pages/HRDashboard/index'));
} catch (error) {
  console.error('Failed to load lazy components:', error);
  // Fallback for iOS compatibility - load components normally
  DeveloperDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  CompanyAdminDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  OperationsManagerDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  BookingOfficeDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  BoardingOperatorDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  DriverDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  DepotManagerDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  MaintenanceManagerDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  FinanceDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
  HRDashboard = () => React.createElement('div', null, 'Loading Dashboard...');
}

import Signup from './pages/Signup';
import Login from './pages/Login';

// iOS-safe storage helpers
function safeGetStorage(key, defaultValue) {
  try {
    if (typeof Storage !== 'undefined' && localStorage) {
      return localStorage.getItem(key) || defaultValue;
    }
  } catch (error) {
    console.warn('Storage access failed:', error);
  }
  return defaultValue;
}

function safeSetStorage(key, value) {
  try {
    if (typeof Storage !== 'undefined' && localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn('Storage write failed:', error);
  }
}

// iOS-safe object access
function safeGet(obj, path, defaultValue) {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    return result;
  } catch (error) {
    return defaultValue;
  }
}

function App() {
  const [mode, setMode] = useState('light');
  const [isReady, setIsReady] = useState(false);

  // iOS-safe initialization
  useEffect(() => {
    console.log('App initializing...');
    
    // Initialize with fallback
    const initializeApp = function() {
      try {
        // Initialize global context safely
        if (typeof window !== 'undefined') {
          window.companyId = window.companyId || null;
          window.userRole = window.userRole || null;
          window.user = window.user || {};
        }

        // iOS-safe Supabase auth initialization
        if (supabase && supabase.auth) {
          supabase.auth.getUser()
            .then(function(response) {
              try {
                const user = safeGet(response, 'data.user', null);
                if (user && user.user_metadata) {
                  if (!window.companyId && user.user_metadata.companyId) {
                    window.companyId = user.user_metadata.companyId;
                  }
                  if (!window.userRole && user.user_metadata.role) {
                    window.userRole = user.user_metadata.role;
                  }
                  window.user = { role: window.userRole };
                }
                
                // Fallback to localStorage
                if (!window.companyId) {
                  window.companyId = safeGetStorage('companyId', null);
                }
                if (!window.userRole) {
                  window.userRole = safeGetStorage('userRole', null);
                }
                if (!window.user.id) {
                  const uid = safeGetStorage('userId', null);
                  if (uid) {
                    window.user = Object.assign({}, window.user, { id: uid, role: window.userRole });
                  }
                }
                
                setIsReady(true);
              } catch (error) {
                console.warn('Auth initialization error:', error);
                setIsReady(true);
              }
            })
            .catch(function(error) {
              console.warn('Auth fetch error:', error);
              setIsReady(true);
            });
        } else {
          setIsReady(true);
        }
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  // iOS-safe auth listener
  useEffect(() => {
    if (!supabase || !supabase.auth) return;

    try {
      const subscription = supabase.auth.onAuthStateChange(function(event, session) {
        try {
          if (session && session.user && session.user.id) {
            const uid = session.user.id;
            if (!window.user || !window.user.id) {
              window.user = Object.assign({}, window.user, { id: uid, role: window.userRole });
            }
            
            // Restore profile if missing
            if (!window.companyId || !window.userRole) {
              supabase
                .from('users')
                .select('company_id, role')
                .eq('user_id', uid)
                .maybeSingle()
                .then(function(response) {
                  const data = safeGet(response, 'data', null);
                  if (data) {
                    window.companyId = window.companyId || data.company_id;
                    window.userRole = window.userRole || data.role;
                    if (data.company_id) safeSetStorage('companyId', data.company_id);
                    if (data.role) safeSetStorage('userRole', data.role);
                    safeSetStorage('userId', uid);
                  }
                })
                .catch(function(error) {
                  console.warn('Profile fetch error:', error);
                });
            }
          }
        } catch (error) {
          console.warn('Auth state change error:', error);
        }
      });

      return function() {
        try {
          if (subscription && subscription.data && subscription.data.subscription) {
            subscription.data.subscription.unsubscribe();
          }
        } catch (error) {
          console.warn('Auth cleanup error:', error);
        }
      };
    } catch (error) {
      console.warn('Auth listener setup error:', error);
      return function() {};
    }
  }, []);

  // iOS-safe theme loading
  useEffect(() => {
    const saved = safeGetStorage('ui-mode', 'light');
    setMode(saved);
  }, []);

  const muiTheme = useMemo(function() {
    try {
      return createTheme(Object.assign({}, theme, {
        palette: Object.assign({}, theme.palette, { mode: mode })
      }));
    } catch (error) {
      console.warn('Theme creation error:', error);
      return createTheme();
    }
  }, [mode]);

  const toggleMode = function() {
    setMode(function(currentMode) {
      const next = currentMode === 'light' ? 'dark' : 'light';
      safeSetStorage('ui-mode', next);
      return next;
    });
  };

  // Don't render until ready
  if (!isReady) {
    return React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui'
      }
    }, 'Loading...');
  }

  return React.createElement(ThemeProvider, { theme: muiTheme },
    React.createElement(CssBaseline),
    React.createElement(SnackbarProvider, {
      maxSnack: 3,
      autoHideDuration: 3000,
      anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
    },
      React.createElement(ErrorBoundary, null,
        React.createElement(Router, null,
          React.createElement('div', {
            style: { position: 'fixed', right: 12, bottom: 12, zIndex: 9999 }
          },
            React.createElement(IconButton, {
              color: 'inherit',
              onClick: toggleMode,
              'aria-label': 'toggle theme'
            },
              mode === 'light' 
                ? React.createElement(DarkModeIcon)
                : React.createElement(LightModeIcon)
            )
          ),
          React.createElement(Suspense, { fallback: null },
            React.createElement(Routes, null,
              React.createElement(Route, { path: '/', element: React.createElement(Login) }),
              React.createElement(Route, { path: '/signup', element: React.createElement(Signup) }),
              React.createElement(Route, { path: '/developer-dashboard', element: React.createElement(DeveloperDashboard) }),
              React.createElement(Route, { path: '/admin-dashboard', element: React.createElement(CompanyAdminDashboard) }),
              React.createElement(Route, { path: '/ops-dashboard', element: React.createElement(OperationsManagerDashboard) }),
              React.createElement(Route, { path: '/booking-dashboard', element: React.createElement(BookingOfficeDashboard) }),
              React.createElement(Route, { path: '/boarding-operator-dashboard', element: React.createElement(BoardingOperatorDashboard) }),
              React.createElement(Route, { path: '/driver-dashboard', element: React.createElement(DriverDashboard) }),
              React.createElement(Route, { path: '/depot-dashboard', element: React.createElement(DepotManagerDashboard) }),
              React.createElement(Route, { path: '/maintenance-dashboard', element: React.createElement(MaintenanceManagerDashboard) }),
              React.createElement(Route, { path: '/finance-dashboard', element: React.createElement(FinanceDashboard) }),
              React.createElement(Route, { path: '/hr-dashboard', element: React.createElement(HRDashboard) })
            )
          )
        )
      )
    )
  );
}

export default App;
