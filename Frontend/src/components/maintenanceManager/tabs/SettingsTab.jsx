import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { supabase } from '../../../utils/supabaseClient';

export default function SettingsTab() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Settings states
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'VTS Maintenance System',
    timezone: 'UTC',
    currency: 'USD',
    language: 'en'
  });

  const [companyDefaults, setCompanyDefaults] = useState({
    defaultPlan: 'basic',
    trialPeriod: 30,
    maxUsers: 10,
    maxBuses: 50
  });

  const [bookingSettings, setBookingSettings] = useState({
    commissionPercent: 5,
    refundPolicy: '24_hours',
    transactionRetryLimit: 3
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailTemplates: true,
    systemNotifications: true,
    criticalErrorThreshold: 5,
    maintenanceReminders: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: 'strong',
    twoFactorAuth: false,
    sessionTimeout: 30
  });

  const [auditSettings, setAuditSettings] = useState({
    logRetentionPeriod: 365,
    detailedLogging: true,
    criticalErrorNotifications: true
  });

  // Get company ID from user context
  const companyId = 'your-company-id'; // Replace with actual company ID

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;

      if (data && data.length > 0) {
        const settings = data[0];
        setGeneralSettings(settings.general || generalSettings);
        setCompanyDefaults(settings.company_defaults || companyDefaults);
        setBookingSettings(settings.booking || bookingSettings);
        setNotificationSettings(settings.notifications || notificationSettings);
        setSecuritySettings(settings.security || securitySettings);
        setAuditSettings(settings.audit || auditSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSnackbar({ open: true, message: 'Error fetching settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const settingsData = {
        company_id: companyId,
        general: generalSettings,
        company_defaults: companyDefaults,
        booking: bookingSettings,
        notifications: notificationSettings,
        security: securitySettings,
        audit: auditSettings,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert(settingsData);

      if (error) throw error;
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ open: true, message: 'Error saving settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    setGeneralSettings({
      platformName: 'VTS Maintenance System',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en'
    });
    setCompanyDefaults({
      defaultPlan: 'basic',
      trialPeriod: 30,
      maxUsers: 10,
      maxBuses: 50
    });
    setBookingSettings({
      commissionPercent: 5,
      refundPolicy: '24_hours',
      transactionRetryLimit: 3
    });
    setNotificationSettings({
      emailTemplates: true,
      systemNotifications: true,
      criticalErrorThreshold: 5,
      maintenanceReminders: true
    });
    setSecuritySettings({
      passwordPolicy: 'strong',
      twoFactorAuth: false,
      sessionTimeout: 30
    });
    setAuditSettings({
      logRetentionPeriod: 365,
      detailedLogging: true,
      criticalErrorNotifications: true
    });
    setSnackbar({ open: true, message: 'Settings reset to default', severity: 'info' });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleResetSettings}
          >
            Reset to Default
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="General Settings" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Company Defaults" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Booking & Transactions" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Notifications & Alerts" icon={<NotificationsIcon />} iconPosition="start" />
          <Tab label="Security Settings" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Audit & Logs" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Card>
        <CardContent>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Platform Name"
                  value={generalSettings.platformName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Timezone</InputLabel>
                  <Select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                    label="Default Timezone"
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="EST">Eastern Time</MenuItem>
                    <MenuItem value="PST">Pacific Time</MenuItem>
                    <MenuItem value="GMT">GMT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Currency</InputLabel>
                  <Select
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                    label="Default Currency"
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="ZAR">ZAR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Language</InputLabel>
                  <Select
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                    label="Default Language"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Subscription Plan</InputLabel>
                  <Select
                    value={companyDefaults.defaultPlan}
                    onChange={(e) => setCompanyDefaults({ ...companyDefaults, defaultPlan: e.target.value })}
                    label="Default Subscription Plan"
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Trial Period (days)"
                  type="number"
                  value={companyDefaults.trialPeriod}
                  onChange={(e) => setCompanyDefaults({ ...companyDefaults, trialPeriod: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Users per Company"
                  type="number"
                  value={companyDefaults.maxUsers}
                  onChange={(e) => setCompanyDefaults({ ...companyDefaults, maxUsers: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Buses per Company"
                  type="number"
                  value={companyDefaults.maxBuses}
                  onChange={(e) => setCompanyDefaults({ ...companyDefaults, maxBuses: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Commission Percentage"
                  type="number"
                  value={bookingSettings.commissionPercent}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, commissionPercent: parseFloat(e.target.value) })}
                  InputProps={{ endAdornment: '%' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Refund Policy</InputLabel>
                  <Select
                    value={bookingSettings.refundPolicy}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, refundPolicy: e.target.value })}
                    label="Refund Policy"
                  >
                    <MenuItem value="24_hours">24 Hours</MenuItem>
                    <MenuItem value="48_hours">48 Hours</MenuItem>
                    <MenuItem value="7_days">7 Days</MenuItem>
                    <MenuItem value="no_refund">No Refund</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Transaction Retry Limit"
                  type="number"
                  value={bookingSettings.transactionRetryLimit}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, transactionRetryLimit: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailTemplates}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailTemplates: e.target.checked })}
                    />
                  }
                  label="Enable Email Templates"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.systemNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, systemNotifications: e.target.checked })}
                    />
                  }
                  label="Enable System Notifications"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.maintenanceReminders}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, maintenanceReminders: e.target.checked })}
                    />
                  }
                  label="Enable Maintenance Reminders"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Critical Error Threshold"
                  type="number"
                  value={notificationSettings.criticalErrorThreshold}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, criticalErrorThreshold: parseInt(e.target.value) })}
                  helperText="Number of errors before sending alert"
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Password Policy</InputLabel>
                  <Select
                    value={securitySettings.passwordPolicy}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordPolicy: e.target.value })}
                    label="Password Policy"
                  >
                    <MenuItem value="basic">Basic (6+ characters)</MenuItem>
                    <MenuItem value="medium">Medium (8+ chars, 1 number)</MenuItem>
                    <MenuItem value="strong">Strong (8+ chars, 1 number, 1 special)</MenuItem>
                    <MenuItem value="very_strong">Very Strong (12+ chars, mixed case, numbers, symbols)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                    />
                  }
                  label="Enable Two-Factor Authentication"
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 5 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Log Retention Period (days)"
                  type="number"
                  value={auditSettings.logRetentionPeriod}
                  onChange={(e) => setAuditSettings({ ...auditSettings, logRetentionPeriod: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={auditSettings.detailedLogging}
                      onChange={(e) => setAuditSettings({ ...auditSettings, detailedLogging: e.target.checked })}
                    />
                  }
                  label="Enable Detailed Logging"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={auditSettings.criticalErrorNotifications}
                      onChange={(e) => setAuditSettings({ ...auditSettings, criticalErrorNotifications: e.target.checked })}
                    />
                  }
                  label="Enable Critical Error Notifications"
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}