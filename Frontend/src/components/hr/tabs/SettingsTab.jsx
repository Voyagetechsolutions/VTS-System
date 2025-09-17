import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Grid, Divider, Alert } from '@mui/material';
import { Save as SaveIcon, Restore as RestoreIcon, Security as SecurityIcon, Dashboard as DashboardIcon, Notifications as NotificationsIcon, Settings as SettingsIcon } from '@mui/icons-material';

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    // General Settings
    platformName: 'VTS HR System',
    defaultTimezone: 'UTC',
    defaultCurrency: 'USD',
    defaultLanguage: 'English',
    
    // Company Defaults
    defaultSubscriptionPlan: 'Basic',
    trialPeriod: 30,
    maxUsersPerCompany: 50,
    maxBusesPerCompany: 20,
    
    // Booking & Transactions Settings
    commissionPercentage: 5,
    defaultPaymentMethods: ['Credit Card', 'Bank Transfer'],
    refundPolicy: 'Standard 7-day refund policy',
    transactionRetryLimit: 3,
    
    // Notifications & Alerts
    emailNotifications: true,
    systemNotifications: true,
    notificationThresholds: {
      lowStock: 10,
      maintenanceDue: 7,
      certificationExpiry: 30
    },
    
    // Security Settings
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    twoFactorAuth: false,
    sessionTimeout: 30,
    
    // Audit & Logs Settings
    logRetentionPeriod: 365,
    detailedLogging: true,
    criticalErrorNotifications: true
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleSaveChanges = () => {
    // TODO: Implement save functionality
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const handleResetToDefault = () => {
    // TODO: Implement reset functionality
    console.log('Resetting to default settings');
    alert('Settings reset to default values!');
  };

  const renderGeneralSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Platform Name"
          value={settings.platformName}
          onChange={(e) => setSettings({...settings, platformName: e.target.value})}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Default Timezone</InputLabel>
          <Select
            value={settings.defaultTimezone}
            label="Default Timezone"
            onChange={(e) => setSettings({...settings, defaultTimezone: e.target.value})}
          >
            <MenuItem value="UTC">UTC</MenuItem>
            <MenuItem value="EST">Eastern Time</MenuItem>
            <MenuItem value="PST">Pacific Time</MenuItem>
            <MenuItem value="GMT">Greenwich Mean Time</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Default Currency</InputLabel>
          <Select
            value={settings.defaultCurrency}
            label="Default Currency"
            onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
          >
            <MenuItem value="USD">USD ($)</MenuItem>
            <MenuItem value="EUR">EUR (€)</MenuItem>
            <MenuItem value="GBP">GBP (£)</MenuItem>
            <MenuItem value="ZAR">ZAR (R)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Default Language</InputLabel>
          <Select
            value={settings.defaultLanguage}
            label="Default Language"
            onChange={(e) => setSettings({...settings, defaultLanguage: e.target.value})}
          >
            <MenuItem value="English">English</MenuItem>
            <MenuItem value="Spanish">Spanish</MenuItem>
            <MenuItem value="French">French</MenuItem>
            <MenuItem value="German">German</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderCompanyDefaults = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Default Subscription Plan</InputLabel>
          <Select
            value={settings.defaultSubscriptionPlan}
            label="Default Subscription Plan"
            onChange={(e) => setSettings({...settings, defaultSubscriptionPlan: e.target.value})}
          >
            <MenuItem value="Basic">Basic</MenuItem>
            <MenuItem value="Standard">Standard</MenuItem>
            <MenuItem value="Premium">Premium</MenuItem>
            <MenuItem value="Enterprise">Enterprise</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Trial Period (days)"
          type="number"
          value={settings.trialPeriod}
          onChange={(e) => setSettings({...settings, trialPeriod: parseInt(e.target.value)})}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Max Users per Company"
          type="number"
          value={settings.maxUsersPerCompany}
          onChange={(e) => setSettings({...settings, maxUsersPerCompany: parseInt(e.target.value)})}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Max Buses per Company"
          type="number"
          value={settings.maxBusesPerCompany}
          onChange={(e) => setSettings({...settings, maxBusesPerCompany: parseInt(e.target.value)})}
        />
      </Grid>
    </Grid>
  );

  const renderSecuritySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Password Policy</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Minimum Password Length"
          type="number"
          value={settings.passwordPolicy.minLength}
          onChange={(e) => setSettings({
            ...settings, 
            passwordPolicy: {...settings.passwordPolicy, minLength: parseInt(e.target.value)}
          })}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.passwordPolicy.requireUppercase}
              onChange={(e) => setSettings({
                ...settings, 
                passwordPolicy: {...settings.passwordPolicy, requireUppercase: e.target.checked}
              })}
            />
          }
          label="Require Uppercase Letters"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.passwordPolicy.requireNumbers}
              onChange={(e) => setSettings({
                ...settings, 
                passwordPolicy: {...settings.passwordPolicy, requireNumbers: e.target.checked}
              })}
            />
          }
          label="Require Numbers"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.passwordPolicy.requireSpecialChars}
              onChange={(e) => setSettings({
                ...settings, 
                passwordPolicy: {...settings.passwordPolicy, requireSpecialChars: e.target.checked}
              })}
            />
          }
          label="Require Special Characters"
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.twoFactorAuth}
              onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
            />
          }
          label="Enable Two-Factor Authentication"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Session Timeout (minutes)"
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
        />
      </Grid>
    </Grid>
  );

  const renderNotificationsSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
            />
          }
          label="Enable Email Notifications"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.systemNotifications}
              onChange={(e) => setSettings({...settings, systemNotifications: e.target.checked})}
            />
          }
          label="Enable System Notifications"
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Notification Thresholds</Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Low Stock Alert (days)"
          type="number"
          value={settings.notificationThresholds.lowStock}
          onChange={(e) => setSettings({
            ...settings, 
            notificationThresholds: {...settings.notificationThresholds, lowStock: parseInt(e.target.value)}
          })}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Maintenance Due Alert (days)"
          type="number"
          value={settings.notificationThresholds.maintenanceDue}
          onChange={(e) => setSettings({
            ...settings, 
            notificationThresholds: {...settings.notificationThresholds, maintenanceDue: parseInt(e.target.value)}
          })}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Certification Expiry Alert (days)"
          type="number"
          value={settings.notificationThresholds.certificationExpiry}
          onChange={(e) => setSettings({
            ...settings, 
            notificationThresholds: {...settings.notificationThresholds, certificationExpiry: parseInt(e.target.value)}
          })}
        />
      </Grid>
    </Grid>
  );

  const renderAuditLogsSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Log Retention Period (days)"
          type="number"
          value={settings.logRetentionPeriod}
          onChange={(e) => setSettings({...settings, logRetentionPeriod: parseInt(e.target.value)})}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.detailedLogging}
              onChange={(e) => setSettings({...settings, detailedLogging: e.target.checked})}
            />
          }
          label="Enable Detailed Logging"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.criticalErrorNotifications}
              onChange={(e) => setSettings({...settings, criticalErrorNotifications: e.target.checked})}
            />
          }
          label="Critical Error Notifications"
        />
      </Grid>
    </Grid>
  );

  const tabs = [
    { id: 'general', label: 'General Settings', icon: <SettingsIcon /> },
    { id: 'company', label: 'Company Defaults', icon: <DashboardIcon /> },
    { id: 'security', label: 'Security Settings', icon: <SecurityIcon /> },
    { id: 'notifications', label: 'Notifications & Alerts', icon: <NotificationsIcon /> },
    { id: 'audit', label: 'Audit & Logs Settings', icon: <SettingsIcon /> }
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          HR Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleResetToDefault}
          >
            Reset to Default
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Settings Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'contained' : 'outlined'}
                  startIcon={tab.icon}
                  onClick={() => setActiveTab(tab.id)}
                  sx={{ mb: 1 }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Tab Content */}
          <Box sx={{ minHeight: 400 }}>
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'company' && renderCompanyDefaults()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'notifications' && renderNotificationsSettings()}
            {activeTab === 'audit' && renderAuditLogsSettings()}
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            Changes to these settings will affect all users and companies in the system. 
            Please review carefully before saving.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
