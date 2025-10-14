import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddTrainingModal({ open, onClose, onSuccess, staff }) {
  const [form, setForm] = useState({
    employee_id: '',
    employee_name: '',
    department: '',
    course_name: '',
    status: 'assigned',
    date_assigned: new Date().toISOString().split('T')[0],
    date_completed: '',
    expiry_date: '',
    certification_file_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  const handleEmployeeChange = (employeeId) => {
    const selectedEmployee = staff.find(emp => emp.id === employeeId);
    if (selectedEmployee) {
      setForm(prev => ({
        ...prev,
        employee_id: employeeId,
        employee_name: selectedEmployee.name,
        department: selectedEmployee.department
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.employee_id || !form.course_name || !form.date_assigned) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate dates
      if (form.date_completed && form.date_assigned && new Date(form.date_completed) < new Date(form.date_assigned)) {
        setError('Completion date cannot be before assignment date');
        return;
      }

      if (form.expiry_date && form.date_completed && new Date(form.expiry_date) < new Date(form.date_completed)) {
        setError('Expiry date cannot be before completion date');
        return;
      }

      const { error: insertError } = await supabase.from('training_certifications').insert([{
        company_id: companyId,
        employee_id: form.employee_id,
        employee_name: form.employee_name,
        department: form.department,
        course_name: form.course_name,
        status: form.status,
        date_assigned: form.date_assigned,
        date_completed: form.date_completed || null,
        expiry_date: form.expiry_date || null,
        certification_file_url: form.certification_file_url || null
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        employee_id: '',
        employee_name: '',
        department: '',
        course_name: '',
        status: 'assigned',
        date_assigned: new Date().toISOString().split('T')[0],
        date_completed: '',
        expiry_date: '',
        certification_file_url: ''
      });

      onSuccess();
      alert('Training record added successfully!');
    } catch (error) {
      console.error('Error adding training record:', error);
      setError('Error adding training record: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        employee_id: '',
        employee_name: '',
        department: '',
        course_name: '',
        status: 'assigned',
        date_assigned: new Date().toISOString().split('T')[0],
        date_completed: '',
        expiry_date: '',
        certification_file_url: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Training Record</DialogTitle>
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
                {staff.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.department}
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
              disabled
              helperText="Auto-filled based on employee"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Course / Certification Name"
              value={form.course_name}
              onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                label="Status"
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date Assigned"
              type="date"
              value={form.date_assigned}
              onChange={(e) => setForm({ ...form, date_assigned: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date Completed"
              type="date"
              value={form.date_completed}
              onChange={(e) => setForm({ ...form, date_completed: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
              helperText="Optional - leave empty if not completed"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expiry Date"
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
              helperText="Optional - for certifications that expire"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Certification File URL"
              value={form.certification_file_url}
              onChange={(e) => setForm({ ...form, certification_file_url: e.target.value })}
              disabled={loading}
              helperText="Optional - URL to certificate file (PDF, image, etc.)"
            />
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
          {loading ? 'Adding...' : 'Add Training Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
