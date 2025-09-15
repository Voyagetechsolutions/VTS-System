import React, { useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert, Divider } from '@mui/material';
import { supabase } from '../../supabase/client';

export default function ProfileSettingsTab() {
  const [name, setName] = useState(window.user?.name || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaQr, setMfaQr] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      if (name) {
        await window.supabase.from('users').update({ name }).eq('user_id', window.userId);
      }
      if (password) {
        await supabase.auth.updateUser({ password });
      }
      setMsg('Saved');
    } catch (e) { setMsg(e?.message || 'Save failed'); }
    setSaving(false);
  };

  const startMfaEnroll = async () => {
    setMfaError(''); setMfaQr(''); setMfaCode(''); setMfaEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setMfaFactorId(data.id);
      setMfaQr(data.totp.qr_code || '');
    } catch (e) {
      setMfaError(e?.message || 'Failed to start MFA enrollment');
      setMfaEnrolling(false);
    }
  };

  const verifyMfaEnroll = async () => {
    setMfaError('');
    try {
      await supabase.auth.mfa.verify({ factorId: mfaFactorId, code: mfaCode });
      setMfaEnrolling(false);
      setMsg('MFA enabled');
    } catch (e) {
      setMfaError(e?.message || 'Verification failed');
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Profile & Settings</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2} maxWidth={420}>
          <TextField label="Name" value={name} onChange={e => setName(e.target.value)} />
          <TextField label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" disabled={saving} onClick={save}>Save</Button>
            {msg && <Typography variant="body2">{msg}</Typography>}
          </Stack>
          <Divider />
          <Typography variant="subtitle1">Multi‑Factor Authentication (TOTP)</Typography>
          {!mfaEnrolling && (
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={startMfaEnroll}>Enable TOTP</Button>
            </Stack>
          )}
          {mfaEnrolling && (
            <Stack spacing={2}>
              {mfaError && <Alert severity="error">{mfaError}</Alert>}
              {mfaQr && <img src={mfaQr} alt="Scan with authenticator app" style={{ width: 200, height: 200 }} />}
              <TextField label="Enter 6‑digit code" value={mfaCode} onChange={e => setMfaCode(e.target.value)} />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={verifyMfaEnroll} disabled={!mfaCode}>Verify</Button>
                <Button variant="text" onClick={() => { setMfaEnrolling(false); setMfaQr(''); setMfaCode(''); }}>Cancel</Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}


