import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { Routes, Route, useLocation, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline, IconButton, TextField, Button, Stack, AppBar, Toolbar, Typography, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from './utils/apiClient';
import { SnackbarProvider } from 'notistack';
import { createTheme } from '@mui/material/styles';
import ErrorBoundary from './components/common/ErrorBoundary';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import theme from './theme/theme';
import { supabase } from './supabase/client';
import './index.css';
import './styles/globalStyles.css';
const DeveloperDashboard = React.lazy(() => import('./pages/DeveloperDashboard/index'));
const CompanyAdminDashboard = React.lazy(() => import('./pages/CompanyAdminDashboard/index'));
const OperationsManagerDashboard = React.lazy(() => import('./pages/OperationsManagerDashboard/index'));
const BookingOfficeDashboard = React.lazy(() => import('./pages/BookingOfficeDashboard/index'));
const BoardingOperatorDashboard = React.lazy(() => import('./pages/BoardingOperatorDashboard/index'));
import Signup from './pages/Signup';
const DriverDashboard = React.lazy(() => import('./pages/DriverDashboard/index'));
const DepotManagerDashboard = React.lazy(() => import('./pages/DepotManagerDashboard/index'));
const MaintenanceManagerDashboard = React.lazy(() => import('./pages/MaintenanceManagerDashboard/index'));
const FinanceDashboard = React.lazy(() => import('./pages/FinanceDashboard/index'));
const HRDashboard = React.lazy(() => import('./pages/HRDashboard/index'));
const FleetTracking = React.lazy(() => import('./pages/FleetTracking/index'));
import Login from './pages/Login';

function App() {
  const [mode, setMode] = useState('light');
  const [companyIdInput, setCompanyIdInput] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const TopBar = () => {
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
              } catch {}
            }}
            sx={{ mr: 1 }}
          >Set</Button>
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            onClick={async () => {
              try { await api.logout(); } catch {}
              try { window.location.assign('/'); } catch { window.location.href = '/'; }
            }}
          >Logout</Button>
        </Toolbar>
      </AppBar>
    );
  };
  useEffect(() => {
    // Initialize window.companyId and window.userRole from Supabase auth
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (user?.user_metadata) {
          if (!window.companyId && user.user_metadata.companyId) window.companyId = user.user_metadata.companyId;
          if (!window.userRole && user.user_metadata.role) window.userRole = user.user_metadata.role;
          window.user = { role: window.userRole };
        }
        // Rehydrate from localStorage as fallback
        if (!window.companyId) { try { window.companyId = localStorage.getItem('companyId') || window.companyId; } catch {} }
        if (!window.userRole) { try { window.userRole = localStorage.getItem('userRole') || window.userRole; } catch {} }
        if (!window.user?.id) { try { const uid = localStorage.getItem('userId'); if (uid) window.user = { ...(window.user||{}), id: uid, role: window.userRole }; } catch {} }
      } catch {}
    })();
  }, []);
  useEffect(() => {
    // initialize input from current companyId
    try { setCompanyIdInput((window.companyId ?? localStorage.getItem('companyId') ?? '') + ''); } catch {}
  }, []);
  useEffect(() => {
    // Global auth listener to keep context synced after recoverable errors
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        if (session?.user?.id) {
          const uid = session.user.id;
          if (!window.user || !window.user.id) window.user = { ...(window.user||{}), id: uid, role: window.userRole };
          // attempt to restore profile-derived context if missing
          if (!window.companyId || !window.userRole) {
            // lightweight fetch of profile
            supabase.from('users').select('company_id, role').eq('user_id', uid).maybeSingle().then(({ data }) => {
              if (data) {
                window.companyId = window.companyId || data.company_id;
                window.userRole = window.userRole || data.role;
                try {
                  if (data.company_id) localStorage.setItem('companyId', data.company_id);
                  if (data.role) localStorage.setItem('userRole', data.role);
                  localStorage.setItem('userId', uid);
                } catch {}
              }
            });
          }
        }
      } catch {}
    });
    return () => { try { sub.subscription?.unsubscribe?.(); } catch {} };
  }, []);
  useEffect(() => { try { const saved = localStorage.getItem('ui-mode'); if (saved) setMode(saved); } catch {} }, []);
  const muiTheme = useMemo(() => createTheme({ ...theme, palette: { ...theme.palette, mode } }), [mode]);
  const toggleMode = () => { setMode(m => { const next = m === 'light' ? 'dark' : 'light'; try { localStorage.setItem('ui-mode', next); } catch {} return next; }); };
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={3000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <ErrorBoundary>
          {(() => {
            const router = createBrowserRouter([
              { path: '/', element: <Login /> },
              { path: '/signup', element: <Signup /> },
              { path: '/developer-dashboard', element: <DeveloperDashboard /> },
              { path: '/admin-dashboard', element: <CompanyAdminDashboard /> },
              { path: '/ops-dashboard', element: <OperationsManagerDashboard /> },
              { path: '/booking-dashboard', element: <BookingOfficeDashboard /> },
              { path: '/boarding-operator-dashboard', element: <BoardingOperatorDashboard /> },
              { path: '/driver-dashboard', element: <DriverDashboard /> },
              { path: '/depot-dashboard', element: <DepotManagerDashboard /> },
              { path: '/maintenance-dashboard', element: <MaintenanceManagerDashboard /> },
              { path: '/finance-dashboard', element: <FinanceDashboard /> },
              { path: '/hr-dashboard', element: <HRDashboard /> },
              { path: '/fleet-tracking', element: <FleetTracking /> },
            ]);
            return (
              <>
                <TopBar />
                <Toolbar />
                <Box sx={{ px: 0 }}>
                  <Suspense fallback={null}>
                    <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true }} />
                  </Suspense>
                </Box>
              </>
            );
          })()}
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;