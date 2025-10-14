import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, IconButton, TextField, Button, AppBar, Toolbar, Typography, Box } from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { createTheme } from '@mui/material/styles';
import ErrorBoundary from './components/common/ErrorBoundary';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import theme from './theme/theme';
import { supabase } from './supabase/client';
import { performLogout } from './utils/logout';
import './index.css';
import './styles/globalStyles.css';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Wait for auth initialization
        const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
        setUserRole(role);
        setIsAuthenticated(!!role);
        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    };

    // Check immediately if window variables are already set
    if (window.userRole || window.user?.role || localStorage.getItem('userRole')) {
      checkAuth();
    } else {
      // Wait a bit for initialization
      const timer = setTimeout(checkAuth, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Show loading while checking authentication
  if (!authChecked) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check role if required
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
const DeveloperDashboard = React.lazy(() => import('./pages/DeveloperDashboard/index'));
const CompanyAdminDashboard = React.lazy(() => import('./pages/CompanyAdminDashboard/index'));
const OperationsManagerDashboard = React.lazy(() => import('./pages/OperationsManagerDashboard/index'));
const BookingOfficeDashboard = React.lazy(() => import('./pages/BookingOfficeDashboard/index'));
const BoardingOperatorDashboard = React.lazy(() => import('./pages/BoardingOperatorDashboard/index'));
const DriverDashboard = React.lazy(() => import('./pages/DriverDashboard/index'));
const DepotManagerDashboard = React.lazy(() => import('./pages/DepotManagerDashboard/index'));
const MaintenanceManagerDashboard = React.lazy(() => import('./pages/MaintenanceManagerDashboard/index'));
const FinanceDashboard = React.lazy(() => import('./pages/FinanceDashboard/index'));
const HRDashboard = React.lazy(() => import('./pages/HRDashboard/index'));
const FleetTracking = React.lazy(() => import('./pages/FleetTracking/index'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));

// TopBar component moved outside to be used in Layout
function TopBar({ mode, toggleMode, companyIdInput, setCompanyIdInput }) {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const show = location.pathname !== '/';
  if (!show) return null;
  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>VTS</Typography>
        <IconButton color="inherit" onClick={toggleMode} aria-label="toggle theme" size="small" sx={{ mr: 1 }}>
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <TextField
          size="small"
          label="Company ID"
          value={companyIdInput}
          onChange={e => setCompanyIdInput(e.target.value)}
          sx={{ width: 140, mr: 1 }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            try {
              const v = (companyIdInput || '').trim();
              window.companyId = v || null;
              if (v) localStorage.setItem('companyId', v); else localStorage.removeItem('companyId');
              enqueueSnackbar('Company ID updated', { variant: 'success' });
            } catch (error) {
              console.error('Failed to update company ID context', error);
              enqueueSnackbar('Failed to update company ID', { variant: 'error' });
            }
          }}
          sx={{ mr: 1 }}
        >Set</Button>
        <Button
          variant="outlined"
          size="small"
          color="secondary"
          onClick={() => performLogout()}
        >Logout</Button>
      </Toolbar>
    </AppBar>
  );
}

const getInitialMode = () => {
  try {
    return localStorage.getItem('ui-mode') || 'light';
  } catch (error) {
    console.warn('Failed to read ui-mode from storage', error);
    return 'light';
  }
};

const getInitialCompanyIdInput = () => {
  try {
    const fromWindow = typeof window !== 'undefined' ? window.companyId : null;
    const stored = localStorage.getItem('companyId');
    return (fromWindow ?? stored ?? '') + '';
  } catch (error) {
    console.warn('Failed to read companyId from storage', error);
    return '';
  }
};

const AppLayout = ({ mode, toggleMode, companyIdInput, setCompanyIdInput }) => (
  <>
    <TopBar mode={mode} toggleMode={toggleMode} companyIdInput={companyIdInput} setCompanyIdInput={setCompanyIdInput} />
    <Toolbar />
    <Box sx={{ px: 0 }}>
      <Suspense fallback={<Box sx={{ p: 4 }}>Loading…</Box>}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/developer-dashboard" element={<ProtectedRoute requiredRole="developer"><DeveloperDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="admin"><CompanyAdminDashboard /></ProtectedRoute>} />
          <Route path="/ops-dashboard" element={<ProtectedRoute requiredRole="ops_manager"><OperationsManagerDashboard /></ProtectedRoute>} />
          <Route path="/booking-dashboard" element={<ProtectedRoute requiredRole="booking_officer"><BookingOfficeDashboard /></ProtectedRoute>} />
          <Route path="/boarding-operator-dashboard" element={<ProtectedRoute requiredRole="boarding_operator"><BoardingOperatorDashboard /></ProtectedRoute>} />
          <Route path="/driver-dashboard" element={<ProtectedRoute requiredRole="driver"><DriverDashboard /></ProtectedRoute>} />
          <Route path="/depot-dashboard" element={<ProtectedRoute requiredRole="depot_manager"><DepotManagerDashboard /></ProtectedRoute>} />
          <Route path="/maintenance-dashboard" element={<ProtectedRoute requiredRole="maintenance_manager"><MaintenanceManagerDashboard /></ProtectedRoute>} />
          <Route path="/finance-dashboard" element={<ProtectedRoute requiredRole="finance_manager"><FinanceDashboard /></ProtectedRoute>} />
          <Route path="/hr-dashboard" element={<ProtectedRoute requiredRole="hr_manager"><HRDashboard /></ProtectedRoute>} />
          <Route path="/fleet-tracking" element={<ProtectedRoute><FleetTracking /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Box>
  </>
);

function App() {
  const [mode, setMode] = useState(getInitialMode);
  const [companyIdInput, setCompanyIdInput] = useState(getInitialCompanyIdInput);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let active = true;
    const initializeContext = async () => {
      try {
        const storedCompanyId = localStorage.getItem('companyId');
        const storedUserRole = localStorage.getItem('userRole');
        const storedUserId = localStorage.getItem('userId');

        if (storedCompanyId && typeof window !== 'undefined') {
          window.companyId = storedCompanyId;
        }
        if (storedUserRole && typeof window !== 'undefined') {
          window.userRole = storedUserRole;
        }
        if (storedUserId && typeof window !== 'undefined') {
          window.user = { id: storedUserId, role: storedUserRole };
        }

        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (user?.user_metadata && typeof window !== 'undefined') {
          if (!window.companyId && user.user_metadata.companyId) window.companyId = user.user_metadata.companyId;
          if (!window.userRole && user.user_metadata.role) window.userRole = user.user_metadata.role;
          window.user = { ...(window.user || {}), role: window.userRole };
        }

        if (active) {
          const latestCompanyId = typeof window !== 'undefined' ? (window.companyId ?? storedCompanyId ?? '') : (storedCompanyId ?? '');
          setCompanyIdInput(String(latestCompanyId || ''));
        }
      } catch (error) {
        console.error('Error initializing auth context', error);
      } finally {
        if (active) {
          setAuthInitialized(true);
        }
      }
    };

    void initializeContext();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        if (session?.user?.id && typeof window !== 'undefined') {
          const uid = session.user.id;
          window.user = { ...(window.user || {}), id: uid, role: window.userRole };
          if (!window.companyId || !window.userRole) {
            supabase
              .from('users')
              .select('company_id, role')
              .eq('user_id', uid)
              .maybeSingle()
              .then(({ data }) => {
                if (!data) return;
                window.companyId = window.companyId || data.company_id;
                window.userRole = window.userRole || data.role;
                try {
                  if (data.company_id) localStorage.setItem('companyId', data.company_id);
                  if (data.role) localStorage.setItem('userRole', data.role);
                  localStorage.setItem('userId', uid);
                } catch (storageError) {
                  console.error('Failed to persist auth context', storageError);
                }
              });
          }
        }
      } catch (error) {
        console.error('Auth listener error', error);
      }
    });

    return () => {
      try {
        sub.subscription?.unsubscribe?.();
      } catch (error) {
        console.error('Failed to unsubscribe auth listener', error);
      }
    };
  }, []);

  const muiTheme = useMemo(() => createTheme({ ...theme, palette: { ...theme.palette, mode } }), [mode]);

  const toggleMode = () => {
    setMode((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('ui-mode', next);
      } catch (error) {
        console.error('Failed to persist ui-mode', error);
      }
      return next;
    });
  };

  if (!authInitialized) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={3000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <ErrorBoundary>
          <BrowserRouter>
            <AppLayout mode={mode} toggleMode={toggleMode} companyIdInput={companyIdInput} setCompanyIdInput={setCompanyIdInput} />
          </BrowserRouter>
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;