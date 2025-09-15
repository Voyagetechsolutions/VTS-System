import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import { supabase } from '../../../supabase/client';

export default function SettingsTab() {
  const [email, setEmail] = useState(window.user?.email || '');
  const [phone, setPhone] = useState(window.user?.phone || '');
  const [password, setPassword] = useState('');

  const saveProfile = async () => {
    try {
      await supabase.from('users').update({ email, phone }).eq('user_id', window.userId);
      alert('Profile updated');
    } catch { alert('Failed to update profile'); }
  };
  const changePassword = async () => {
    try { await supabase.auth.updateUser({ password }); setPassword(''); alert('Password updated'); } catch { alert('Failed to update password'); }
  };
  return (
    <Box>
      <DashboardCard title="Profile" variant="outlined">
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" label="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <TextField size="small" label="Contact" value={phone} onChange={e=>setPhone(e.target.value)} />
          <Button variant="contained" onClick={saveProfile}>Save</Button>
        </Box>
      </DashboardCard>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Password" variant="outlined">
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField size="small" type="password" label="New Password" value={password} onChange={e=>setPassword(e.target.value)} />
            <Button variant="contained" disabled={!password} onClick={changePassword}>Reset Password</Button>
          </Box>
        </DashboardCard>
      </Box>
    </Box>
  );
}
