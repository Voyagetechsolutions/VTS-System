import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Alert, Tabs, Tab, Chip } from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon, Business as BusinessIcon, Security as SecurityIcon, Notifications as NotificationsIcon, Assessment as AssessmentIcon, Payment as PaymentIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { getPlatformSettings, updatePlatformSettings } from '../../../supabase/api';

export default function SettingsDevTab() {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    platformName: 'Bus Management System',
    defaultTimezone: 'Africa/Johannesburg',
    defaultCurrency: 'ZAR',
    defaultLanguage: 'en',
    defaultPlan: 'Basic',
    defaultTrialPeriod: 30,
    maxUsersPerCompany: 100,
    maxBusesPerCompany: 50,
    commissionPercentage: 5,
    emailNotifications: true,
    smsNotifications: false,
    passwordMinLength: 8,
    passwordComplexity: true,
    twoFactorRequired: false,
    sessionTimeout: 480,
    logRetentionPeriod: 365,
    detailedLogging: true
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data } = await getPlatformSettings();
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updatePlatformSettings(settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    setSaving(false);
  };

  const handleResetToDefault = () => {
    setSettings({
      platformName: 'Bus Management System',
      defaultTimezone: 'Africa/Johannesburg',
      defaultCurrency: 'ZAR',
      defaultLanguage: 'en',
      defaultPlan: 'Basic',
      defaultTrialPeriod: 30,
      maxUsersPerCompany: 100,
      maxBusesPerCompany: 50,
      commissionPercentage: 5,
      emailNotifications: true,
      smsNotifications: false,
      passwordMinLength: 8,
      passwordComplexity: true,
      twoFactorRequired: false,
      sessionTimeout: 480,
      logRetentionPeriod: 365,
      detailedLogging: true
    });
    setHasChanges(true);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">System Settings</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleResetToDefault}>
            Reset to Default
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={!hasChanges || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>You have unsaved changes. Don't forget to save your settings.</Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<SettingsIcon />} label="General" />
            <Tab icon={<BusinessIcon />} label="Company Defaults" />
            <Tab icon={<PaymentIcon />} label="Booking & Transactions" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<AssessmentIcon />} label="Audit & Logs" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="h6" gutterBottom>Platform Configuration</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Platform Name" value={settings.platformName} onChange={(e) => handleSettingChange('platformName', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Timezone</InputLabel>
                  <Select value={settings.defaultTimezone} label="Default Timezone" onChange={(e) => handleSettingChange('defaultTimezone', e.target.value)}>
                    <MenuItem value="Africa/Johannesburg">Africa/Johannesburg</MenuItem>
                    <MenuItem value="Africa/Cairo">Africa/Cairo</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Currency</InputLabel>
                  <Select value={settings.defaultCurrency} label="Default Currency" onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}>
                    <MenuItem value="ZAR">ZAR (South African Rand)</MenuItem>
                    <MenuItem value="USD">USD (US Dollar)</MenuItem>
                    <MenuItem value="EUR">EUR (Euro)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Language</InputLabel>
                  <Select value={settings.defaultLanguage} label="Default Language" onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="af">Afrikaans</MenuItem>
                    <MenuItem value="zu">Zulu</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="h6" gutterBottom>Company Defaults</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Subscription Plan</InputLabel>
                  <Select value={settings.defaultPlan} label="Default Subscription Plan" onChange={(e) => handleSettingChange('defaultPlan', e.target.value)}>
                    <MenuItem value="Basic">Basic</MenuItem>
                    <MenuItem value="Standard">Standard</MenuItem>
                    <MenuItem value="Premium">Premium</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Default Trial Period (days)" type="number" value={settings.defaultTrialPeriod} onChange={(e) => handleSettingChange('defaultTrialPeriod', parseInt(e.target.value))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Max Users per Company" type="number" value={settings.maxUsersPerCompany} onChange={(e) => handleSettingChange('maxUsersPerCompany', parseInt(e.target.value))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Max Buses per Company" type="number" value={settings.maxBusesPerCompany} onChange={(e) => handleSettingChange('maxBusesPerCompany', parseInt(e.target.value))} />
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="h6" gutterBottom>Booking & Transactions</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Commission Percentage" type="number" value={settings.commissionPercentage} onChange={(e) => handleSettingChange('commissionPercentage', parseFloat(e.target.value))} InputProps={{ endAdornment: '%' }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={settings.emailNotifications} onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)} />} label="Email Notifications" />
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="h6" gutterBottom>Notifications & Alerts</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={settings.emailNotifications} onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)} />} label="Email Notifications" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={settings.smsNotifications} onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)} />} label="SMS Notifications" />
              </Grid>
            </Grid>
          )}

          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="h6" gutterBottom>Security Settings</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Password Minimum Length" type="number" value={settings.passwordMinLength} onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={settings.passwordComplexity} onChange={(e) => handleSettingChange('passwordComplexity', e.target.checked)} />} label="Password Complexity Required" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={settings.twoFactorRequired} onChange={(e) => handleSettingChange('twoFactorRequired', e.target.checked)} />} label="Two-Factor Authentication Required" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Session Timeout (minutes)" type="number" value={settings.sessionTimeout} onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))} />
              </Grid>
            </Grid>
          )}

          {activeTab === 5 && (
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="h6" gutterBottom>Audit & Logs</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Log Retention Period (days)" type="number" value={settings.logRetentionPeriod} onChange={(e) => handleSettingChange('logRetentionPeriod', parseInt(e.target.value))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={settings.detailedLogging} onChange={(e) => handleSettingChange('detailedLogging', e.target.checked)} />} label="Detailed Logging Enabled" />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}