import { useState, useEffect } from 'react';
import {
  Grid, TextField, Button, Alert, Box, Typography, Card, CardContent,
  InputAdornment, IconButton
} from '@mui/material';
import { 
  Save as SaveIcon, Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon, Key as KeyIcon 
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function IntegrationsForm({ companySettings, loading, onUpdate }) {
  const [form, setForm] = useState({
    gps_api_key: '',
    payment_gateway_key: '',
    analytics_key: '',
    sms_api_key: '',
    email_api_key: ''
  });
  const [showKeys, setShowKeys] = useState({
    gps_api_key: false,
    payment_gateway_key: false,
    analytics_key: false,
    sms_api_key: false,
    email_api_key: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (companySettings) {
      setForm({
        gps_api_key: companySettings.gps_api_key || '',
        payment_gateway_key: companySettings.payment_gateway_key || '',
        analytics_key: companySettings.analytics_key || '',
        sms_api_key: companySettings.sms_api_key || '',
        email_api_key: companySettings.email_api_key || ''
      });
    }
  }, [companySettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData = {
        gps_api_key: form.gps_api_key.trim() || null,
        payment_gateway_key: form.payment_gateway_key.trim() || null,
        analytics_key: form.analytics_key.trim() || null,
        sms_api_key: form.sms_api_key.trim() || null,
        email_api_key: form.email_api_key.trim() || null
      };

      let result;
      if (companySettings) {
        // Update existing settings
        result = await supabase
          .from('company_settings')
          .update(updateData)
          .eq('id', companyId);
      } else {
        // Create new settings
        result = await supabase
          .from('company_settings')
          .insert([{ id: companyId, ...updateData }]);
      }

      if (result.error) throw result.error;

      setSuccess('Integration settings updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating integrations:', error);
      setError('Error updating integration settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleKeyVisibility = (keyName) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const maskApiKey = (key) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* GPS/Tracking Integration */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyIcon sx={{ mr: 1 }} />
                GPS & Tracking Services
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure GPS tracking and location services integration.
              </Typography>
              <TextField
                fullWidth
                label="GPS API Key"
                type={showKeys.gps_api_key ? 'text' : 'password'}
                value={showKeys.gps_api_key ? form.gps_api_key : maskApiKey(form.gps_api_key)}
                onChange={(e) => setForm({ ...form, gps_api_key: e.target.value })}
                disabled={loading || saving}
                placeholder="Enter your GPS service API key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleKeyVisibility('gps_api_key')}
                        edge="end"
                      >
                        {showKeys.gps_api_key ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Gateway */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyIcon sx={{ mr: 1 }} />
                Payment Gateway
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure payment processing integration for bookings and transactions.
              </Typography>
              <TextField
                fullWidth
                label="Payment Gateway API Key"
                type={showKeys.payment_gateway_key ? 'text' : 'password'}
                value={showKeys.payment_gateway_key ? form.payment_gateway_key : maskApiKey(form.payment_gateway_key)}
                onChange={(e) => setForm({ ...form, payment_gateway_key: e.target.value })}
                disabled={loading || saving}
                placeholder="Enter your payment gateway API key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleKeyVisibility('payment_gateway_key')}
                        edge="end"
                      >
                        {showKeys.payment_gateway_key ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyIcon sx={{ mr: 1 }} />
                Analytics & Reporting
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure analytics services for business intelligence and reporting.
              </Typography>
              <TextField
                fullWidth
                label="Analytics API Key"
                type={showKeys.analytics_key ? 'text' : 'password'}
                value={showKeys.analytics_key ? form.analytics_key : maskApiKey(form.analytics_key)}
                onChange={(e) => setForm({ ...form, analytics_key: e.target.value })}
                disabled={loading || saving}
                placeholder="Enter your analytics service API key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleKeyVisibility('analytics_key')}
                        edge="end"
                      >
                        {showKeys.analytics_key ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Communication Services */}
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyIcon sx={{ mr: 1 }} />
                SMS Service
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                SMS notifications and alerts.
              </Typography>
              <TextField
                fullWidth
                label="SMS API Key"
                type={showKeys.sms_api_key ? 'text' : 'password'}
                value={showKeys.sms_api_key ? form.sms_api_key : maskApiKey(form.sms_api_key)}
                onChange={(e) => setForm({ ...form, sms_api_key: e.target.value })}
                disabled={loading || saving}
                placeholder="Enter SMS service API key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleKeyVisibility('sms_api_key')}
                        edge="end"
                      >
                        {showKeys.sms_api_key ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyIcon sx={{ mr: 1 }} />
                Email Service
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Email notifications and marketing.
              </Typography>
              <TextField
                fullWidth
                label="Email API Key"
                type={showKeys.email_api_key ? 'text' : 'password'}
                value={showKeys.email_api_key ? form.email_api_key : maskApiKey(form.email_api_key)}
                onChange={(e) => setForm({ ...form, email_api_key: e.target.value })}
                disabled={loading || saving}
                placeholder="Enter email service API key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleKeyVisibility('email_api_key')}
                        edge="end"
                      >
                        {showKeys.email_api_key ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || saving}
            size="large"
          >
            {saving ? 'Saving...' : 'Save Integration Settings'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
