import { useState, useEffect } from 'react';
import {
  Grid, TextField, Button, Alert, Box
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function CompanyInfoForm({ companySettings, loading, onUpdate }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    contact: '',
    logo_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (companySettings) {
      setForm({
        name: companySettings.name || '',
        address: companySettings.address || '',
        contact: companySettings.contact || '',
        logo_url: companySettings.logo_url || ''
      });
    }
  }, [companySettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!form.name.trim()) {
        setError('Company name is required');
        return;
      }

      const updateData = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        contact: form.contact.trim() || null,
        logo_url: form.logo_url.trim() || null
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

      setSuccess('Company information updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating company info:', error);
      setError('Error updating company information: ' + error.message);
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
          <TextField
            fullWidth
            label="Company Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            disabled={loading || saving}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Contact Information"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            disabled={loading || saving}
            placeholder="Phone, email, or other contact info"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Company Address"
            multiline
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            disabled={loading || saving}
            placeholder="Full company address"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Logo URL"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            disabled={loading || saving}
            placeholder="https://example.com/logo.png"
            helperText="URL to your company logo image"
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || saving}
            size="large"
          >
            {saving ? 'Saving...' : 'Save Company Information'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
