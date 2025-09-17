import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, RadioGroup, FormControlLabel, Radio } from '@mui/material';

export default function AnnouncementForm({ 
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
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Title"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          error={!formData.title && isEdit}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Message"
          multiline
          rows={4}
          value={formData.message || ''}
          onChange={(e) => handleChange('message', e.target.value)}
          required
          error={!formData.message && isEdit}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Target Audience</InputLabel>
          <Select
            value={formData.targetAudience || 'all'}
            label="Target Audience"
            onChange={(e) => handleChange('targetAudience', e.target.value)}
          >
            <MenuItem value="all">All Users</MenuItem>
            <MenuItem value="company_admins">Company Admins Only</MenuItem>
            <MenuItem value="specific_company">Specific Company</MenuItem>
            <MenuItem value="specific_role">Specific Role</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {formData.targetAudience === 'specific_company' && (
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Select Company</InputLabel>
            <Select
              value={formData.specificCompany || ''}
              label="Select Company"
              onChange={(e) => handleChange('specificCompany', e.target.value)}
            >
              {companies.map(company => (
                <MenuItem key={company.company_id} value={company.company_id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      {formData.targetAudience === 'specific_role' && (
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Select Role</InputLabel>
            <Select
              value={formData.specificRole || ''}
              label="Select Role"
              onChange={(e) => handleChange('specificRole', e.target.value)}
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
      )}
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Delivery Method</Typography>
        <RadioGroup
          value={formData.deliveryMethod || 'both'}
          onChange={(e) => handleChange('deliveryMethod', e.target.value)}
          row
        >
          <FormControlLabel value="dashboard" control={<Radio />} label="Dashboard Notification" />
          <FormControlLabel value="email" control={<Radio />} label="Email" />
          <FormControlLabel value="both" control={<Radio />} label="Both" />
        </RadioGroup>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            value={formData.priority || 'normal'}
            label="Priority"
            onChange={(e) => handleChange('priority', e.target.value)}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Scheduled Date (Optional)"
          type="datetime-local"
          value={formData.scheduledDate || ''}
          onChange={(e) => handleChange('scheduledDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status || 'draft'}
            label="Status"
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}
