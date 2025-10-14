import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddAttendanceModal({ open, onClose, onSuccess, employees }) {
  const [form, setForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in: '',
    check_out: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.employee_id || !form.date) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate check-in and check-out times if provided
      if (form.check_in && form.check_out) {
        const [inHour, inMin] = form.check_in.split(':').map(Number);
        const [outHour, outMin] = form.check_out.split(':').map(Number);
        
        if ((outHour * 60 + outMin) <= (inHour * 60 + inMin)) {
          setError('Check-out time must be after check-in time');
          return;
        }
      }

      // Check if attendance record already exists for this employee and date
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('id')
        .eq('company_id', companyId)
        .eq('employee_id', form.employee_id)
        .eq('date', form.date)
        .single();

      if (existingRecord) {
        setError('Attendance record already exists for this employee on this date');
        return;
      }

      const { error: insertError } = await supabase.from('attendance').insert([{
        company_id: companyId,
        employee_id: form.employee_id,
        date: form.date,
        status: form.status,
        check_in: form.check_in || null,
        check_out: form.check_out || null
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        check_in: '',
        check_out: ''
      });

      onSuccess();
      alert('Attendance record added successfully!');
    } catch (error) {
      console.error('Error adding attendance:', error);
      setError('Error adding attendance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        check_in: '',
        check_out: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Attendance Record</DialogTitle>
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
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
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
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
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
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">Late</MenuItem>
                <MenuItem value="half_day">Half Day</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Check-in Time"
              type="time"
              value={form.check_in}
              onChange={(e) => setForm({ ...form, check_in: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
              helperText="Optional - leave empty if not applicable"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Check-out Time"
              type="time"
              value={form.check_out}
              onChange={(e) => setForm({ ...form, check_out: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
              helperText="Optional - leave empty if not applicable"
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
          {loading ? 'Adding...' : 'Add Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
