import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';

export default function AcceptInvite() {
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);

  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token') || params.get('invite_token');
  }, [location.search]);

  useEffect(() => {
    // If user is already signed in by magic link, we can proceed; otherwise, instruct user
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage('Please sign in from your invite email link first.');
      }
    })();
  }, []);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!inviteToken) return;
      try {
        const resp = await fetch(`${API_BASE_URL}/invitations/resolve?token=${encodeURIComponent(inviteToken)}`);
        if (resp.ok) {
          const info = await resp.json();
          setInviteInfo(info);
        }
      } catch {}
    };
    fetchInvite();
  }, [inviteToken, API_BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Ensure there is a session (invite magic link should have created one)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated session found. Open the invite link from your email.');

      // Optionally set password on first login if policy requires
      if (password) {
        const { error: upErr } = await supabase.auth.updateUser({ password });
        if (upErr) throw upErr;
      }

      // Save basic profile; expects a RLS policy allowing owner to upsert own profile
      const profile = {
        id: session.user.id,
        email: session.user.email,
        first_name: firstName || null,
        last_name: lastName || null,
      };
      // Upsert to public.profiles (you must create this table and RLS in Supabase)
      const { error: profErr } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
      if (profErr) throw profErr;

      // Mark invitation accepted for audit
      if (inviteToken) {
        try {
          await fetch(`${API_BASE_URL}/invitations/mark-accepted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken })
          });
        } catch {}
      }

      setMessage('Your profile has been set up. Redirecting...');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      setError(err.message || 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 520, p: 4, boxShadow: 4 }} elevation={3}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>Accept Invite</Typography>
          {inviteToken && (
            <Alert severity="info">
              Invite token detected. {inviteInfo ? `You were invited as ${inviteInfo.role}${inviteInfo.companyId ? ` (company ${inviteInfo.companyId})` : ''}.` : 'Resolving invite…'}
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}
          <form onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
              <TextField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
              <TextField label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
              <TextField label="Password (optional)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Saving…' : 'Complete setup'}</Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
