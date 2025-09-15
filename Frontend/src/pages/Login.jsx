import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Divider, Stack, Link as MLink, Checkbox, FormControlLabel, IconButton, Select, MenuItem } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../hooks/useAuth';
import { seedMockUsers } from '../mocks/mockAuthUsers';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenant, setTenant] = useState('');
  const [role, setRole] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(navigate);

  const USE_TEST_LOGIN = String(process.env.REACT_APP_USE_TEST_LOGIN || '').toLowerCase() === 'true';

  const setSessionFromProfile = (profile) => {
    try {
      window.userId = profile.user_id;
      window.companyId = profile.company_id;
      window.userRole = profile.role;
      window.user = { id: profile.user_id, role: profile.role, company_id: profile.company_id, name: profile.name || '' };
      localStorage.setItem('userRole', profile.role || '');
      localStorage.setItem('companyId', profile.company_id || '');
      localStorage.setItem('userId', profile.user_id || '');
    } catch {}
  };

  const routeByRole = (role) => {
    switch (role) {
      case 'admin': navigate('/admin-dashboard'); return;
      case 'booking_officer': navigate('/booking-dashboard'); return;
      case 'boarding_operator': navigate('/boarding-operator-dashboard'); return;
      case 'driver': navigate('/driver-dashboard'); return;
      case 'ops_manager': navigate('/ops-dashboard'); return;
      case 'developer': navigate('/developer-dashboard'); return;
      default: navigate('/'); return;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try { seedMockUsers(); } catch {}
    try {
      await login(email, password, role, tenant, remember);
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    if (USE_TEST_LOGIN) { setError('Password reset is disabled in test mode'); return; }
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail((email || '').trim().toLowerCase(), { redirectTo: window.location.origin + '/reset-password' });
      if (err) setError(err.message || 'Failed to send reset email');
    } catch (e) {
      setError(e?.message || 'Failed to send reset email');
    }
  };

  const handleOAuth = async (provider) => {
    setError(null);
    if (USE_TEST_LOGIN) { setError('SSO is disabled in test mode'); return; }
    try {
      await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    } catch (e) {
      setError(e?.message || 'OAuth sign-in failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
      <Paper sx={{ width: 440, p: 4, boxShadow: 4 }} elevation={3}>
        <Stack alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
        </Stack>
        {USE_TEST_LOGIN && <Alert severity="info" sx={{ mb: 2 }}>Test mode is ON — Supabase Auth is bypassed</Alert>}
        <form onSubmit={handleLogin}>
          <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField label="Password" type={showPassword ? 'text' : 'password'} fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required InputProps={{
            endAdornment: (
              <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword(s => !s)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            )
          }} />
          <TextField label="Company ID (optional)" placeholder="e.g. 1" fullWidth margin="normal" value={tenant} onChange={(e) => setTenant(e.target.value)} />
          <Select fullWidth displayEmpty value={role} onChange={(e) => setRole(e.target.value)} sx={{ mt: 1 }}>
            <MenuItem value="">Select Role (optional)</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="booking_officer">Booking Officer</MenuItem>
            <MenuItem value="boarding_operator">Boarding Operator</MenuItem>
            <MenuItem value="driver">Driver</MenuItem>
            <MenuItem value="ops_manager">Operations Manager</MenuItem>
            <MenuItem value="developer">Developer</MenuItem>
            <MenuItem value="depot_manager">Depot Manager</MenuItem>
            <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
            <MenuItem value="finance_manager">Finance Manager</MenuItem>
            <MenuItem value="hr_manager">HR Manager</MenuItem>
          </Select>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
            <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label="Remember me" />
            <MLink component="button" type="button" onClick={handleResetPassword} sx={{ fontSize: 13 }}>Forgot password?</MLink>
          </Stack>
          <Button type="submit" disabled={loading} variant="contained" color="primary" fullWidth sx={{ mt: 1.5 }}>{loading ? 'Signing in…' : 'Login'}</Button>
        </form>

        <Divider sx={{ my: 2 }}>Or continue with</Divider>
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" onClick={() => handleOAuth('google')} disabled={USE_TEST_LOGIN}>Google</Button>
          <Button fullWidth variant="outlined" onClick={() => handleOAuth('azure')} disabled={USE_TEST_LOGIN}>Microsoft</Button>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
          <Typography variant="body2">Don’t have an account?</Typography>
          <MLink href="#" onClick={(e) => { e.preventDefault(); navigate('/entry'); }} variant="body2">Sign up</MLink>
        </Stack>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Divider sx={{ mt: 2, mb: 1 }} />
        <Stack direction="row" spacing={2} justifyContent="center">
          <MLink href="#" variant="caption">Terms</MLink>
          <MLink href="#" variant="caption">Privacy</MLink>
          <MLink href="#" variant="caption">Help</MLink>
        </Stack>
      </Paper>
    </Box>
  );
}
