import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Divider, Stack, Link as MLink, Checkbox, FormControlLabel, IconButton } from '@mui/material';
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
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(navigate);

  const USE_TEST_LOGIN = String(process.env.REACT_APP_USE_TEST_LOGIN || '').toLowerCase() === 'true';

  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try { seedMockUsers(); } catch {}
    try {
      await login(email, password, null, null, remember);
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
            <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label="Remember me" />
            <MLink component="button" type="button" onClick={handleResetPassword} sx={{ fontSize: 13 }}>Forgot password?</MLink>
          </Stack>
          <Button type="submit" disabled={loading} variant="contained" color="primary" fullWidth sx={{ mt: 1.5 }}>{loading ? 'Signing in…' : 'Login'}</Button>
        </form>

        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
          <Typography variant="body2">Don’t have an account?</Typography>
          <MLink href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }} variant="body2">Sign up</MLink>
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
