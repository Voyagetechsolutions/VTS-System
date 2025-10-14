import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Select, MenuItem, Stack } from '@mui/material';
import { getBranches } from '../../../supabase/api';
import { supabase } from '../../../supabase/client';

export default function SettingsTab() {
  const [profile, setProfile] = useState({ name: '', contact: '', branch: '' });
  const [emailForReset, setEmailForReset] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const u = window.user || {}; const email = u.email || '';
      setTimeout(() => {
        setProfile(p => ({ ...p, name: (window.userName || 'Agent'), contact: email }));
        setEmailForReset(email);
      }, 0);
      const { data } = await getBranches();
      setBranches(data || []);
      try { const b = localStorage.getItem('branchId'); if (b) setBranchId(b); } catch (error) { console.warn('Failed to get branch ID:', error); }
    };
    loadData();
  }, []);

  const resetPassword = async () => {
    if (!emailForReset) return;
    try {
      await supabase.auth.resetPasswordForEmail(emailForReset, { redirectTo: window.location.origin + '/reset-password' });
      alert('Password reset email sent.');
    } catch (e) {
      alert('Failed to send reset email');
    }
  };

  return (
    <Box>
      <Typography variant="h5">Settings & Preferences</Typography>
      <Paper sx={{ mt: 2, p: 2 }}>
        <TextField label="Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} fullWidth />
        <TextField label="Contact" value={profile.contact} onChange={e => setProfile(p => ({ ...p, contact: e.target.value }))} sx={{ mb: 2 }} fullWidth />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Branch (label)" value={profile.branch} onChange={e => setProfile(p => ({ ...p, branch: e.target.value }))} fullWidth />
          <Select value={branchId} onChange={e => { setBranchId(e.target.value); try { localStorage.setItem('branchId', e.target.value); window.userBranchId = Number(e.target.value); } catch (error) { console.warn('Failed to save branch ID:', error); } }} displayEmpty fullWidth>
            <MenuItem value="">Select Branch (ID)</MenuItem>
            {(branches||[]).map(b => <MenuItem key={b.branch_id} value={b.branch_id}>{b.name} {b.location ? `• ${b.location}` : ''}</MenuItem>)}
          </Select>
        </Stack>
        {/* Removed printing and payment methods settings as requested */}
        <Box display="flex" gap={2}>
          <Button variant="contained" color="primary">Save Preferences</Button>
          <TextField label="Reset Password Email" value={emailForReset} onChange={e => setEmailForReset(e.target.value)} size="small" />
          <Button variant="outlined" onClick={resetPassword}>Send Reset Email</Button>
        </Box>
      </Paper>
    </Box>
  );
}
