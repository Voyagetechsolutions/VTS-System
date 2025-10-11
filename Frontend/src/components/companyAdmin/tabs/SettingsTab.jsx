import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Stack, Alert, Grid, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Divider } from '@mui/material';
import { getCompanyBasic, getCompanySettings, updateCompanySettings, getCompanySubscription, updateSubscriptionPlan } from '../../../supabase/api';

export default function SettingsTab() {
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState({ address: '', contact: '', logo_url: '', currency: 'USD', timezone: 'UTC+02:00', language: 'en', date_format: 'YYYY-MM-DD', units: 'metric', email_templates: '', sms_templates: '', gps_api_key: '', rbac: {}, modules_visibility: {} });
  const [subscription, setSubscription] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const companyId = useMemo(() => {
    try { return localStorage.getItem('companyId') || window.companyId || null; } catch { return window.companyId || null; }
  }, []);

  const load = async () => {
    const [{ data: c }, { data: s }, { data: sub }] = await Promise.all([
      getCompanyBasic(companyId),
      getCompanySettings(companyId),
      getCompanySubscription(companyId),
    ]);
    setCompany(c || null);
    setSettings({
      address: s?.address || '',
      contact: s?.contact || '',
      logo_url: s?.logo_url || '',
      currency: s?.currency || 'USD',
      timezone: s?.timezone || 'UTC+02:00',
      language: s?.language || 'en',
      date_format: s?.date_format || 'YYYY-MM-DD',
      units: s?.units || 'metric',
      email_templates: s?.email_templates || '',
      sms_templates: s?.sms_templates || '',
      gps_api_key: s?.gps_api_key || '',
      rbac: s?.rbac || {},
      modules_visibility: s?.modules_visibility || {}
    });
    setSubscription(sub || null);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await updateCompanySettings({ ...settings }, companyId);
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

  // RBAC & Module visibility helpers
  const roles = useMemo(() => ['admin','ops_manager','booking_officer','boarding_operator','driver','depot_manager','maintenance_manager','finance_manager','hr_manager'], []);
  const modules = useMemo(() => [
    'Executive Overview','Approvals & Oversight','Global Communications','Oversight Map','Live Map Buses',
    'User Management','Driver Hub','Customer Hub','HR: Profiles','HR: Attendance','HR: Payroll','HR: Training',
    'Fleet Management','Routes & Scheduling','Branches','Bookings & Ticketing','Reports & Analytics','Audit Trail',
    'Maintenance','Fuel Tracking','Trip Scheduling','Depot: Ops Supervisor','Depot: Dispatch','Depot: Staff & Shifts',
    'Inventory & Warehouse','Finance Center','Notifications & Alerts','Trip Info','Compliance & Safety','Documents','Communications','System Settings','Profile'
  ], []);
  const defaultPerms = { view: true, edit: false, approve: false, finance: false, hr: false };
  const [rbacRole, setRbacRole] = useState('admin');

  const rolePerms = (settings.rbac && settings.rbac[rbacRole]) || defaultPerms;
  const roleModules = (settings.modules_visibility && settings.modules_visibility[rbacRole]) || [];

  const togglePerm = (key) => {
    setSettings(s => ({
      ...s,
      rbac: { ...s.rbac, [rbacRole]: { ...(s.rbac?.[rbacRole] || defaultPerms), [key]: !(s.rbac?.[rbacRole]?.[key] ?? defaultPerms[key]) } }
    }));
  };
  const toggleModule = (mod) => {
    const has = roleModules.includes(mod);
    const next = has ? roleModules.filter(m => m !== mod) : roleModules.concat([mod]);
    setSettings(s => ({ ...s, modules_visibility: { ...s.modules_visibility, [rbacRole]: next } }));
  };

  // Dropdown options
  const currencies = [
    { value: 'ZMW', label: 'Kwacha (ZMW)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'NAD', label: 'Namibian Dollar (NAD)' },
    { value: 'ZAR', label: 'South African Rand (ZAR)' },
  ];
  const timezones = [
    'UTC-12:00','UTC-11:00','UTC-10:00','UTC-09:00','UTC-08:00','UTC-07:00','UTC-06:00','UTC-05:00','UTC-04:00','UTC-03:00','UTC-02:00','UTC-01:00','UTC+00:00','UTC+01:00','UTC+02:00','UTC+03:00','UTC+04:00','UTC+05:00','UTC+06:00','UTC+07:00','UTC+08:00','UTC+09:00','UTC+10:00','UTC+11:00','UTC+12:00','UTC+13:00','UTC+14:00'
  ];

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
            <Grid item xs={12} md={3}>
              <Select fullWidth value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} displayEmpty>
                {currencies.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </Select>
            </Grid>
            <Grid item xs={12} md={3}>
              <Select fullWidth value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))} displayEmpty>
                {timezones.map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
              </Select>
            </Grid>
            <Grid item xs={12} md={3}><TextField label="Language" value={settings.language} onChange={e => setSettings(s => ({ ...s, language: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Date format" value={settings.date_format} onChange={e => setSettings(s => ({ ...s, date_format: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} md={3}><TextField label="Units" value={settings.units} onChange={e => setSettings(s => ({ ...s, units: e.target.value }))} fullWidth /></Grid>
          </Grid>

          <Divider sx={{ my: 1 }} />

          <DividerSection title="Notifications" />
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Email templates" value={settings.email_templates} onChange={e => setSettings(s => ({ ...s, email_templates: e.target.value }))} fullWidth multiline minRows={2} /></Grid>
            <Grid item xs={12}><TextField label="SMS templates" value={settings.sms_templates} onChange={e => setSettings(s => ({ ...s, sms_templates: e.target.value }))} fullWidth multiline minRows={2} /></Grid>
          </Grid>

          <DividerSection title="Integrations" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField label="GPS/Tracking API key" value={settings.gps_api_key} onChange={e => setSettings(s => ({ ...s, gps_api_key: e.target.value }))} fullWidth /></Grid>
          </Grid>

          <DividerSection title="Roles & Access Control (RBAC)" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Select fullWidth value={rbacRole} onChange={e => setRbacRole(e.target.value)}>
                {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </Grid>
            <Grid item xs={12} md={9}>
              <FormGroup row>
                <FormControlLabel control={<Checkbox checked={!!rolePerms.view} onChange={() => togglePerm('view')} />} label="View" />
                <FormControlLabel control={<Checkbox checked={!!rolePerms.edit} onChange={() => togglePerm('edit')} />} label="Edit" />
                <FormControlLabel control={<Checkbox checked={!!rolePerms.approve} onChange={() => togglePerm('approve')} />} label="Approve" />
                <FormControlLabel control={<Checkbox checked={!!rolePerms.finance} onChange={() => togglePerm('finance')} />} label="Finance" />
                <FormControlLabel control={<Checkbox checked={!!rolePerms.hr} onChange={() => togglePerm('hr')} />} label="HR" />
              </FormGroup>
            </Grid>
          </Grid>

          <DividerSection title="Module Visibility by Role" />
          <Typography variant="body2" color="text.secondary">Toggle which modules are visible for role: {rbacRole}</Typography>
          <Grid container spacing={1} sx={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #eee', p: 1, borderRadius: 1 }}>
            {modules.map(m => (
              <Grid item key={m} xs={12} sm={6} md={4}>
                <FormControlLabel control={<Checkbox checked={roleModules.includes(m)} onChange={() => toggleModule(m)} />} label={m} />
              </Grid>
            ))}
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
