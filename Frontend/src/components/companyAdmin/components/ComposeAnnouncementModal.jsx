import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert, Chip, Box,
  OutlinedInput
} from '@mui/material';
import { supabase } from '../../../supabase/client';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'driver', label: 'Drivers' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admins' },
  { value: 'hr_manager', label: 'HR Managers' },
  { value: 'booking_officer', label: 'Booking Officers' },
  { value: 'maintenance_manager', label: 'Maintenance Managers' }
];

export default function ComposeAnnouncementModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    target_roles: [],
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  const handleTargetRolesChange = (event) => {
    const value = event.target.value;
    setForm({ ...form, target_roles: typeof value === 'string' ? value.split(',') : value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.title.trim() || !form.message.trim() || form.target_roles.length === 0) {
        setError('Please fill in all required fields and select target audience');
        return;
      }

      const { error: insertError } = await supabase.from('announcements').insert([{
        company_id: companyId,
        title: form.title.trim(),
        message: form.message.trim(),
        target_roles: form.target_roles,
        status: form.status
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        title: '',
        message: '',
        target_roles: [],
        status: 'draft'
      });

      onSuccess();
      alert(`Announcement ${form.status === 'draft' ? 'saved as draft' : 'sent'} successfully!`);
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('Error creating announcement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        title: '',
        message: '',
        target_roles: [],
        status: 'draft'
      });
      setError('');
      onClose();
    }
  };

  const handleSendNow = () => {
    setForm({ ...form, status: 'sent' });
    setTimeout(() => handleSubmit(), 100);
  };

  const handleSaveAsDraft = () => {
    setForm({ ...form, status: 'draft' });
    setTimeout(() => handleSubmit(), 100);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Announcement</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Announcement Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              disabled={loading}
              placeholder="Enter announcement title..."
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Target Audience</InputLabel>
              <Select
                multiple
                value={form.target_roles}
                onChange={handleTargetRolesChange}
                input={<OutlinedInput label="Target Audience" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={ROLE_OPTIONS.find(role => role.value === value)?.label || value}
                        size="small" 
                      />
                    ))}
                  </Box>
                )}
                disabled={loading}
              >
                {ROLE_OPTIONS.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Announcement Message"
              multiline
              rows={8}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              disabled={loading}
              placeholder="Type your announcement message here..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveAsDraft} 
          variant="outlined" 
          disabled={loading}
        >
          {loading && form.status === 'draft' ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button 
          onClick={handleSendNow} 
          variant="contained" 
          disabled={loading}
        >
          {loading && form.status === 'sent' ? 'Sending...' : 'Send Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
