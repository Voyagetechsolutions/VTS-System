import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stack, 
  IconButton, 
  Alert, 
  Divider, 
  Tooltip, 
  FormControlLabel, 
  Checkbox 
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../supabase/client';

export default function Login() {
  const { signInWithPassword, signInWithProvider } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remember, setRemember] = useState(() => {
    try { return localStorage.getItem('rememberDevice') === 'true'; } catch { return false; }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('invite_token');
  }, [location.search]);

  // Branding and SSO flags from env
  const logoUrl = process.env.REACT_APP_LOGO_URL || '';
  const appName = process.env.REACT_APP_APP_NAME || 'VTS';
  const enableGoogle = String(process.env.REACT_APP_ENABLE_GOOGLE_OAUTH || '').toLowerCase() === 'true';
  const enableAzure = String(process.env.REACT_APP_ENABLE_AZURE_OAUTH || '').toLowerCase() === 'true';

  const routeByRole = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'developer') return '/developer-dashboard';
    if (r === 'admin' || r === 'company_admin') return '/admin-dashboard';
    if (r === 'ops_manager' || r === 'operations_manager') return '/ops-dashboard';
    if (r === 'booking_officer') return '/booking-dashboard';
    if (r === 'boarding_operator') return '/boarding-operator-dashboard';
    if (r === 'driver') return '/driver-dashboard';
    if (r === 'depot_manager') return '/depot-dashboard';
    if (r === 'maintenance_manager') return '/maintenance-dashboard';
    if (r === 'finance_manager') return '/finance-dashboard';
    if (r === 'hr_manager') return '/hr-dashboard';
    return '/login';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const emailLower = email.trim().toLowerCase();
      const data = await signInWithPassword(emailLower, password);
      const uid = data?.user?.id || data?.session?.user?.id;
      let role = null;
      // Prefer public.users by email to avoid profiles 404s
      try {
        const { data: u2 } = await supabase
          .from('users')
          .select('user_id, role, company_id')
          .eq('email', emailLower)
          .maybeSingle();
        if (u2) {
          role = u2.role || null;
          try {
            if (u2.company_id != null) localStorage.setItem('companyId', String(u2.company_id));
            if (role) localStorage.setItem('userRole', role);
            if (u2.user_id) localStorage.setItem('userId', String(u2.user_id));
          } catch {}
        }
      } catch {}
      // If still no role and we have an auth uid, optionally read from profiles
      if (!role && uid) {
        try {
          const { data: prof } = await supabase.from('profiles').select('role, company_id').eq('id', uid).maybeSingle();
          role = prof?.role || role;
          try {
            if (prof?.company_id != null) localStorage.setItem('companyId', String(prof.company_id));
            if (role) localStorage.setItem('userRole', role);
            if (uid) localStorage.setItem('userId', uid);
          } catch {}
        } catch {}
      }
      navigate(routeByRole(role));
    } catch (err) {
      // Fallback auth via RPC against public.users (requires function app_login_user)
      try {
        const emailLower = email.trim().toLowerCase();
        const { data: loginRes, error: rpcErr } = await supabase.rpc('app_login_user', {
          p_email: emailLower,
          p_password: password
        });
        if (rpcErr) throw rpcErr;
        if (loginRes && loginRes.user_id) {
          try {
            if (loginRes.company_id != null) localStorage.setItem('companyId', String(loginRes.company_id));
            if (loginRes.role) localStorage.setItem('userRole', String(loginRes.role));
            localStorage.setItem('userId', String(loginRes.user_id));
          } catch {}
          navigate(routeByRole(loginRes.role));
          return;
        }
        setError('Invalid email or password');
      } catch (fallbackErr) {
        setError(fallbackErr?.message || err.message || 'Invalid email or password');
      }
      // Focus first invalid field for a11y
      if (!email) {
        try { emailRef.current?.focus(); } catch {}
      } else {
        try { passwordRef.current?.focus(); } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProvider = async (provider) => {
    setError(null);
    try {
      await signInWithProvider(provider, { redirectTo: window.location.origin });
    } catch (err) {
      setError(err.message || 'SSO failed');
    }
  };

  // Auto-redirect if a session already exists (e.g., after OAuth return)
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) return;
        // Avoid profiles call; use existing localStorage if present
        const role = localStorage.getItem('userRole');
        if (role) {
          navigate(routeByRole(role));
        }
      } catch {}
    })();
  }, [navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
      <Paper component="section" aria-label="Sign in" sx={{ width: '100%', maxWidth: 480, p: 4, boxShadow: 4, borderRadius: 3, transition: 'transform 150ms ease, box-shadow 150ms ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }} elevation={3}>
        <Stack spacing={2}>
          <Stack spacing={0.5} alignItems="center">
            {/* Branded logo */}
            {logoUrl ? (
              <Box aria-hidden component="img" src={logoUrl} alt="Logo" sx={{ width: 48, height: 48, borderRadius: 2, boxShadow: 1, objectFit: 'contain', transition: 'opacity 150ms' }} />
            ) : (
              <Box aria-hidden sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.main', opacity: 0.9, boxShadow: 1 }} />
            )}
            <Typography variant="h5" component="h1" fontWeight={700}>Sign in to {appName}</Typography>
            <Typography variant="body2" color="text.secondary">Enter your work email to continue</Typography>
          </Stack>

          {inviteToken && (
            <Alert severity="info" onClose={() => {}}>
              You have an invite pending. <Link to={`/accept-invite?token=${inviteToken}`}>Accept your invite</Link>
            </Alert>
          )}

          <Box role="status" aria-live="polite">
            {error && <Alert severity="error" role="alert">{error}</Alert>}
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
              <TextField
                label="Email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputProps={{ 'aria-label': 'Email' }}
                fullWidth
                required
                inputRef={emailRef}
                aria-invalid={Boolean(error) && !email}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                inputProps={{ 'aria-label': 'Password' }}
                fullWidth
                required
                inputRef={passwordRef}
                aria-invalid={Boolean(error) && !!email && !password}
                InputProps={{
                  endAdornment: (
                    <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword((s) => !s)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={remember} onChange={(e) => {
                    setRemember(e.target.checked);
                    try { localStorage.setItem('rememberDevice', e.target.checked ? 'true' : 'false'); } catch {}
                  }} aria-label="Remember this device" />
                  <Typography variant="body2">Remember this device</Typography>
                </label>
                <Button component={Link} to="/forgot-password" variant="text" size="small">Forgot password?</Button>
              </Stack>
              <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </form>

          <Divider>Or continue with</Divider>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Tooltip title={enableGoogle ? '' : 'Google SSO is not configured'} disableHoverListener={enableGoogle}>
              <span style={{ width: '100%' }}>
                <Button onClick={() => enableGoogle && handleProvider('google')} variant="outlined" startIcon={<GoogleIcon /> } fullWidth disabled={!enableGoogle} sx={{ transition: 'transform 120ms', '&:hover': { transform: enableGoogle ? 'translateY(-1px)' : 'none' } }}>
                  Google
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={enableAzure ? '' : 'Microsoft SSO is not configured'} disableHoverListener={enableAzure}>
              <span style={{ width: '100%' }}>
                <Button onClick={() => enableAzure && handleProvider('azure')} variant="outlined" startIcon={<MicrosoftIcon /> } fullWidth disabled={!enableAzure} sx={{ transition: 'transform 120ms', '&:hover': { transform: enableAzure ? 'translateY(-1px)' : 'none' } }}>
                  Microsoft
                </Button>
              </span>
            </Tooltip>
          </Stack>

          <Stack alignItems="center" spacing={0.5}>
            <Typography variant="body2" color="text.secondary">Don’t have an account? Contact your admin.</Typography>
            <Button component={Link} to="/help" variant="text" size="small">Need help?</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
