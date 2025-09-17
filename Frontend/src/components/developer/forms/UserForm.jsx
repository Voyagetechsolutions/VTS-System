import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';

export default function UserForm({ 
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
          label="Full Name"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          error={!formData.name && isEdit}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email Address"
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
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Company</InputLabel>
          <Select
            value={formData.company_id || ''}
            label="Company"
            onChange={(e) => handleChange('company_id', e.target.value)}
            required
          >
            <MenuItem value="">Select Company</MenuItem>
            {companies.map(company => (
              <MenuItem key={company.company_id} value={company.company_id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Role</InputLabel>
          <Select
            value={formData.role || 'admin'}
            label="Role"
            onChange={(e) => handleChange('role', e.target.value)}
            required
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="ops_manager">Operations Manager</MenuItem>
            <MenuItem value="booking_officer">Booking Officer</MenuItem>
            <MenuItem value="driver">Driver</MenuItem>
            <MenuItem value="developer">Developer</MenuItem>
            <MenuItem value="hr_manager">HR Manager</MenuItem>
            <MenuItem value="finance_manager">Finance Manager</MenuItem>
            <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
            <MenuItem value="depot_manager">Depot Manager</MenuItem>
            <MenuItem value="boarding_operator">Boarding Operator</MenuItem>
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
            <MenuItem value="Suspended">Suspended</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Employee ID"
          value={formData.employeeId || ''}
          onChange={(e) => handleChange('employeeId', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Department"
          value={formData.department || ''}
          onChange={(e) => handleChange('department', e.target.value)}
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
          label="Active User"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.twoFactorEnabled || false}
              onChange={(e) => handleChange('twoFactorEnabled', e.target.checked)}
            />
          }
          label="Two-Factor Authentication"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.emailNotifications || true}
              onChange={(e) => handleChange('emailNotifications', e.target.checked)}
            />
          }
          label="Email Notifications"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.smsNotifications || false}
              onChange={(e) => handleChange('smsNotifications', e.target.checked)}
            />
          }
          label="SMS Notifications"
        />
      </Grid>
    </Grid>
  );
}
