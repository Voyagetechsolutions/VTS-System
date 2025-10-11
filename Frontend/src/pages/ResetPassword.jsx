import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { supabase } from '../supabase/client';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // When redirected from email, Supabase provides a recovery session
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setMessage('Open the reset link from your email to continue.');
        }
      } catch {}
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!password || password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Your password has been updated. You can close this page.');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 480, p: 4, boxShadow: 4 }} elevation={3}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>Reset password</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}
          <form onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
              <TextField label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required />
              <TextField label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} fullWidth required />
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Saving…' : 'Update password'}</Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
