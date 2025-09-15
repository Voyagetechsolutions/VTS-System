import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Stack, Alert } from '@mui/material';
import { getCompanyBasic, getCompanySettings, getCompanySubscription } from '../../../supabase/api';

// SettingsTab: Company info (read-only for Ops Manager)
export default function SettingsTab() {
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState({ address: '', contact: '' });
  const [subscription, setSubscription] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      const [{ data: c, error: e1 }, { data: s, error: e2 }, { data: sub, error: e3 }] = await Promise.all([
        getCompanyBasic(),
        getCompanySettings(),
        getCompanySubscription(),
      ]);
      if (e1 || e2 || e3) setMsg('Some info could not be loaded.');
      setCompany(c || null);
      setSettings({ address: s?.address || '', contact: s?.contact || '' });
      setSubscription(sub || null);
    };
    load();
  }, []);

  return (
    <Box>
      <Typography variant="h5">Company Settings</Typography>
      {msg ? <Alert severity="warning" sx={{ mt: 1 }}>{msg}</Alert> : null}
      <Paper sx={{ mt: 2, p: 2 }}>
        <Stack spacing={2}>
          <TextField label="Company Name" value={company?.name || ''} fullWidth disabled />
          <TextField label="Address" value={settings.address} fullWidth disabled />
          <TextField label="Contact" value={settings.contact} fullWidth disabled />
          <TextField label="Subscription Plan" value={subscription?.plan || company?.subscription_plan || ''} fullWidth disabled />
        </Stack>
      </Paper>
    </Box>
  );
}
