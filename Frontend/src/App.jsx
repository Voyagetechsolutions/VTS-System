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
const DeveloperDashboard = React.lazy(() => import('./pages/DeveloperDashboard/index'));
const CompanyAdminDashboard = React.lazy(() => import('./pages/CompanyAdminDashboard/index'));
const OperationsManagerDashboard = React.lazy(() => import('./pages/OperationsManagerDashboard/index'));
const BookingOfficeDashboard = React.lazy(() => import('./pages/BookingOfficeDashboard/index'));
const BoardingOperatorDashboard = React.lazy(() => import('./pages/BoardingOperatorDashboard/index'));
import EntryPoint from './pages/EntryPoint';
const DriverDashboard = React.lazy(() => import('./pages/DriverDashboard/index'));
const DepotManagerDashboard = React.lazy(() => import('./pages/DepotManagerDashboard/index'));
const MaintenanceManagerDashboard = React.lazy(() => import('./pages/MaintenanceManagerDashboard/index'));
const FinanceDashboard = React.lazy(() => import('./pages/FinanceDashboard/index'));
const HRDashboard = React.lazy(() => import('./pages/HRDashboard/index'));
import Login from './pages/Login';

function App() {
  const [mode, setMode] = useState('light');
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
          <Router>
            <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999 }}>
              <IconButton color="inherit" onClick={toggleMode} aria-label="toggle theme">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </div>
            <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/entry" element={<EntryPoint />} />
              <Route path="/developer-dashboard" element={<DeveloperDashboard />} />
              <Route path="/admin-dashboard" element={<CompanyAdminDashboard />} />
              <Route path="/ops-dashboard" element={<OperationsManagerDashboard />} />
              <Route path="/booking-dashboard" element={<BookingOfficeDashboard />} />
              <Route path="/boarding-operator-dashboard" element={<BoardingOperatorDashboard />} />
              <Route path="/driver-dashboard" element={<DriverDashboard />} />
              <Route path="/depot-dashboard" element={<DepotManagerDashboard />} />
              <Route path="/maintenance-dashboard" element={<MaintenanceManagerDashboard />} />
              <Route path="/finance-dashboard" element={<FinanceDashboard />} />
              <Route path="/hr-dashboard" element={<HRDashboard />} />
            </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
