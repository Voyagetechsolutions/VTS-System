import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { supabase } from '../supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (error) throw error;
      setMessage('If the email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 480, p: 4, boxShadow: 4 }} elevation={3}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>Forgot password</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}
          <form onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
              <TextField label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" fullWidth required />
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
