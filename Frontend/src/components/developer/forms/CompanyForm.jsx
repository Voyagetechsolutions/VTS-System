import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';

export default function CompanyForm({ 
  formData, 
  setFormData, 
  companies = [], 
  isEdit = false 
}) {
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company Name"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          error={!formData.name && isEdit}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Registration Number"
          value={formData.registrationNumber || ''}
          onChange={(e) => handleChange('registrationNumber', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Contact Email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          error={!formData.email && isEdit}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Company Address"
          multiline
          rows={2}
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Default Plan</InputLabel>
          <Select
            value={formData.plan || 'Basic'}
            label="Default Plan"
            onChange={(e) => handleChange('plan', e.target.value)}
          >
            <MenuItem value="Basic">Basic</MenuItem>
            <MenuItem value="Standard">Standard</MenuItem>
            <MenuItem value="Premium">Premium</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status || 'Active'}
            label="Status"
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Suspended">Suspended</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Website URL"
          value={formData.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Tax Number"
          value={formData.taxNumber || ''}
          onChange={(e) => handleChange('taxNumber', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.isActive !== false}
              onChange={(e) => handleChange('isActive', e.target.checked)}
            />
          }
          label="Active Company"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.autoApprove || false}
              onChange={(e) => handleChange('autoApprove', e.target.checked)}
            />
          }
          label="Auto-approve Bookings"
        />
      </Grid>
    </Grid>
  );
}
