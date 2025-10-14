import { useState, useEffect } from 'react';
import {
  Grid, Button, Alert, Box, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function SystemPreferencesForm({ companySettings, loading, onUpdate }) {
  const [form, setForm] = useState({
    currency: 'USD',
    timezone: 'UTC+00:00',
    language: 'en',
    date_format: 'YYYY-MM-DD',
    units: 'metric'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (companySettings) {
      setForm({
        currency: companySettings.currency || 'USD',
        timezone: companySettings.timezone || 'UTC+00:00',
        language: companySettings.language || 'en',
        date_format: companySettings.date_format || 'YYYY-MM-DD',
        units: companySettings.units || 'metric'
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
        currency: form.currency,
        timezone: form.timezone,
        language: form.language,
        date_format: form.date_format,
        units: form.units
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

      setSuccess('System preferences updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating system preferences:', error);
      setError('Error updating system preferences: ' + error.message);
    } finally {
      setSaving(false);
    }
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
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select
              value={form.currency}
              label="Currency"
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              disabled={loading || saving}
            >
              <MenuItem value="USD">USD - US Dollar</MenuItem>
              <MenuItem value="ZAR">ZAR - South African Rand</MenuItem>
              <MenuItem value="EUR">EUR - Euro</MenuItem>
              <MenuItem value="GBP">GBP - British Pound</MenuItem>
              <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
              <MenuItem value="AUD">AUD - Australian Dollar</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={form.timezone}
              label="Timezone"
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              disabled={loading || saving}
            >
              <MenuItem value="UTC+00:00">UTC+00:00 - Greenwich Mean Time</MenuItem>
              <MenuItem value="UTC+02:00">UTC+02:00 - South Africa Standard Time</MenuItem>
              <MenuItem value="UTC-05:00">UTC-05:00 - Eastern Standard Time</MenuItem>
              <MenuItem value="UTC-08:00">UTC-08:00 - Pacific Standard Time</MenuItem>
              <MenuItem value="UTC+01:00">UTC+01:00 - Central European Time</MenuItem>
              <MenuItem value="UTC+08:00">UTC+08:00 - China Standard Time</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Language</InputLabel>
            <Select
              value={form.language}
              label="Language"
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              disabled={loading || saving}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="af">Afrikaans</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="de">German</MenuItem>
              <MenuItem value="pt">Portuguese</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Date Format</InputLabel>
            <Select
              value={form.date_format}
              label="Date Format"
              onChange={(e) => setForm({ ...form, date_format: e.target.value })}
              disabled={loading || saving}
            >
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2024-01-15)</MenuItem>
              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (15/01/2024)</MenuItem>
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (01/15/2024)</MenuItem>
              <MenuItem value="DD-MM-YYYY">DD-MM-YYYY (15-01-2024)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Units</InputLabel>
            <Select
              value={form.units}
              label="Units"
              onChange={(e) => setForm({ ...form, units: e.target.value })}
              disabled={loading || saving}
            >
              <MenuItem value="metric">Metric (km, kg, °C)</MenuItem>
              <MenuItem value="imperial">Imperial (miles, lbs, °F)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || saving}
            size="large"
          >
            {saving ? 'Saving...' : 'Save System Preferences'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
