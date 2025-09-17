import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Stack, Alert, Grid, Select, MenuItem } from '@mui/material';
import { getCompanyBasic, getCompanySettings, updateCompanySettings, getCompanySubscription, updateSubscriptionPlan } from '../../../supabase/api';

export default function SettingsTab() {
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState({ address: '', contact: '', logo_url: '', currency: 'USD', timezone: 'UTC', language: 'en', date_format: 'YYYY-MM-DD', units: 'metric', bus_capacity_default: 60, seat_layout: '2x2', vehicle_categories: 'mini,midi,coach', refund_policy: '', booking_limit: 5, commission_rate: 0, tax_vat: 0, bank_details: '', email_templates: '', sms_templates: '', gps_api_key: '' });
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
    setSettings({
      address: s?.address || '',
      contact: s?.contact || '',
      logo_url: s?.logo_url || '',
      currency: s?.currency || 'USD',
      timezone: s?.timezone || 'UTC',
      language: s?.language || 'en',
      date_format: s?.date_format || 'YYYY-MM-DD',
      units: s?.units || 'metric',
      bus_capacity_default: s?.bus_capacity_default || 60,
      seat_layout: s?.seat_layout || '2x2',
      vehicle_categories: s?.vehicle_categories || 'mini,midi,coach',
      refund_policy: s?.refund_policy || '',
      booking_limit: s?.booking_limit || 5,
      commission_rate: s?.commission_rate || 0,
      tax_vat: s?.tax_vat || 0,
      bank_details: s?.bank_details || '',
      email_templates: s?.email_templates || '',
      sms_templates: s?.sms_templates || '',
      gps_api_key: s?.gps_api_key || ''
    });
    setSubscription(sub || null);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await updateCompanySettings({ ...settings });
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
          <DividerSection title="System Preferences" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField label="Currency" value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Time zone" value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Language" value={settings.language} onChange={e => setSettings(s => ({ ...s, language: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Date format" value={settings.date_format} onChange={e => setSettings(s => ({ ...s, date_format: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Units" value={settings.units} onChange={e => setSettings(s => ({ ...s, units: e.target.value }))} fullWidth /></Grid>
          </Grid>

          <DividerSection title="Fleet Settings" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><TextField label="Default capacity" type="number" value={settings.bus_capacity_default} onChange={e => setSettings(s => ({ ...s, bus_capacity_default: Number(e.target.value||0) }))} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Seat layout" value={settings.seat_layout} onChange={e => setSettings(s => ({ ...s, seat_layout: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={6}><TextField label="Vehicle categories" value={settings.vehicle_categories} onChange={e => setSettings(s => ({ ...s, vehicle_categories: e.target.value }))} fullWidth /></Grid>
          </Grid>

          <DividerSection title="Ticketing Settings" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField label="Refund policy" value={settings.refund_policy} onChange={e => setSettings(s => ({ ...s, refund_policy: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={4}><TextField label="Booking limit per passenger" type="number" value={settings.booking_limit} onChange={e => setSettings(s => ({ ...s, booking_limit: Number(e.target.value||0) }))} fullWidth /></Grid>
            <Grid item xs={12} md={4}><TextField label="Commission rate (%)" type="number" value={settings.commission_rate} onChange={e => setSettings(s => ({ ...s, commission_rate: Number(e.target.value||0) }))} fullWidth /></Grid>
          </Grid>

          <DividerSection title="Payment & Finance" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField label="Bank details" value={settings.bank_details} onChange={e => setSettings(s => ({ ...s, bank_details: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Tax/VAT (%)" type="number" value={settings.tax_vat} onChange={e => setSettings(s => ({ ...s, tax_vat: Number(e.target.value||0) }))} fullWidth /></Grid>
          </Grid>

          <DividerSection title="Notifications" />
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Email templates" value={settings.email_templates} onChange={e => setSettings(s => ({ ...s, email_templates: e.target.value }))} fullWidth multiline minRows={2} /></Grid>
            <Grid item xs={12}><TextField label="SMS templates" value={settings.sms_templates} onChange={e => setSettings(s => ({ ...s, sms_templates: e.target.value }))} fullWidth multiline minRows={2} /></Grid>
          </Grid>

          <DividerSection title="Integrations" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField label="GPS/Tracking API key" value={settings.gps_api_key} onChange={e => setSettings(s => ({ ...s, gps_api_key: e.target.value }))} fullWidth /></Grid>
          </Grid>
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

function DividerSection({ title }) {
  return (
    <>
      <Box sx={{ mt: 2 }} />
      <Typography variant="subtitle1">{title}</Typography>
    </>
  );
}
