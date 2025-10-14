import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function EditStaffModal({ open, onClose, onSuccess, staffMember }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    phone: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (staffMember && open) {
      setForm({
        name: staffMember.name || '',
        email: staffMember.email || '',
        department: staffMember.department || '',
        role: staffMember.role || '',
        phone: staffMember.phone || '',
        status: staffMember.status || 'active'
      });
    }
  }, [staffMember, open]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.name || !form.email || !form.department || !form.role) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Check if email already exists (excluding current staff member)
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('email', form.email)
        .eq('company_id', companyId)
        .neq('id', staffMember.id)
        .single();

      if (existingStaff) {
        setError('A staff member with this email already exists');
        return;
      }

      const { error: updateError } = await supabase
        .from('staff')
        .update({
          name: form.name,
          email: form.email,
          department: form.department,
          role: form.role,
          phone: form.phone || null,
          status: form.status
        })
        .eq('id', staffMember.id);

      if (updateError) throw updateError;

      onSuccess();
      alert('Staff member updated successfully!');
    } catch (error) {
      console.error('Error updating staff:', error);
      setError('Error updating staff: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Staff Member</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={form.department}
                label="Department"
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Booking">Booking</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={form.role}
                label="Role"
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="hr_manager">HR Manager</MenuItem>
                <MenuItem value="booking_officer">Booking Officer</MenuItem>
                <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                label="Status"
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Staff Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
