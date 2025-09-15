import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Stack, Alert } from '@mui/material';
import { getCompanyBasic, getCompanySettings, updateCompanySettings, getCompanySubscription, updateSubscriptionPlan } from '../../../supabase/api';

export default function SettingsTab() {
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState({ address: '', contact: '', logo_url: '' });
  const [subscription, setSubscription] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [{ data: c }, { data: s }, { data: sub }] = await Promise.all([
      getCompanyBasic(),
      getCompanySettings(),
      getCompanySubscription(),
    ]);
    setCompany(c || null);
    setSettings({ address: s?.address || '', contact: s?.contact || '', logo_url: s?.logo_url || '' });
    setSubscription(sub || null);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await updateCompanySettings({ address: settings.address, contact: settings.contact, logo_url: settings.logo_url });
    setSaving(false);
    setMsg(error ? `Save failed: ${error.message || error}` : 'Saved');
  };

  const upgrade = async () => {
    if (!subscription?.id) return;
    const { error } = await updateSubscriptionPlan(subscription.id, 'Enterprise');
    setMsg(error ? 'Upgrade failed' : 'Upgraded');
    load();
  };
  const downgrade = async () => {
    if (!subscription?.id) return;
    const { error } = await updateSubscriptionPlan(subscription.id, 'Pro');
    setMsg(error ? 'Downgrade failed' : 'Downgraded');
    load();
  };

  return (
    <Box>
      <Typography variant="h5">System Settings</Typography>
      {msg ? <Alert severity="info" sx={{ mt: 1 }}>{msg}</Alert> : null}
      <Paper sx={{ mt: 2, p: 2 }}>
        <Stack spacing={2}>
          <TextField label="Company Name" value={company?.name || ''} fullWidth disabled />
          <TextField label="Address" value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} fullWidth />
          <TextField label="Contact" value={settings.contact} onChange={e => setSettings(s => ({ ...s, contact: e.target.value }))} fullWidth />
          <TextField label="Logo URL" value={settings.logo_url} onChange={e => setSettings(s => ({ ...s, logo_url: e.target.value }))} fullWidth />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" color="success" onClick={save} disabled={saving}>Save Changes</Button>
            <Button variant="outlined" onClick={upgrade} disabled={!subscription?.id}>Upgrade Plan</Button>
            <Button variant="outlined" color="secondary" onClick={downgrade} disabled={!subscription?.id}>Downgrade Plan</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
