import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddShiftModal({ open, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({
    employee_id: '',
    department: '',
    role: '',
    start_time: '',
    end_time: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.employee_id || !form.start_time || !form.end_time) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate that end time is after start time
      if (new Date(form.end_time) <= new Date(form.start_time)) {
        setError('End time must be after start time');
        return;
      }

      const selectedEmployee = employees.find(emp => emp.user_id === form.employee_id);

      const { error: insertError } = await supabase.from('shifts').insert([{
        company_id: companyId,
        employee_id: form.employee_id,
        department: form.department || selectedEmployee?.department || '',
        role: form.role || selectedEmployee?.role || '',
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        status: form.status
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        employee_id: '',
        department: '',
        role: '',
        start_time: '',
        end_time: '',
        status: 'active'
      });

      onSuccess();
      alert('Shift added successfully!');
    } catch (error) {
      console.error('Error adding shift:', error);
      setError('Error adding shift: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (employeeId) => {
    const selectedEmployee = employees.find(emp => emp.user_id === employeeId);
    setForm({
      ...form,
      employee_id: employeeId,
      department: selectedEmployee?.department || '',
      role: selectedEmployee?.role || ''
    });
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        employee_id: '',
        department: '',
        role: '',
        start_time: '',
        end_time: '',
        status: 'active'
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Shift</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Employee</InputLabel>
              <Select
                value={form.employee_id}
                label="Employee"
                onChange={(e) => handleEmployeeChange(e.target.value)}
                disabled={loading}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.user_id} value={employee.user_id}>
                    {employee.name} - {employee.department} ({employee.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Time"
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
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
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
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
          {loading ? 'Adding...' : 'Add Shift'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
