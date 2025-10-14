import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function EditTrainingModal({ open, onClose, onSuccess, trainingRecord }) {
  const [form, setForm] = useState({
    employee_name: '',
    department: '',
    course_name: '',
    status: 'assigned',
    date_assigned: '',
    date_completed: '',
    expiry_date: '',
    certification_file_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (trainingRecord && open) {
      setForm({
        employee_name: trainingRecord.employee_name || '',
        department: trainingRecord.department || '',
        course_name: trainingRecord.course_name || '',
        status: trainingRecord.status || 'assigned',
        date_assigned: trainingRecord.date_assigned || '',
        date_completed: trainingRecord.date_completed || '',
        expiry_date: trainingRecord.expiry_date || '',
        certification_file_url: trainingRecord.certification_file_url || ''
      });
    }
  }, [trainingRecord, open]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.course_name || !form.date_assigned) {
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

      const { error: updateError } = await supabase
        .from('training_certifications')
        .update({
          course_name: form.course_name,
          status: form.status,
          date_assigned: form.date_assigned,
          date_completed: form.date_completed || null,
          expiry_date: form.expiry_date || null,
          certification_file_url: form.certification_file_url || null
        })
        .eq('id', trainingRecord.id);

      if (updateError) throw updateError;

      onSuccess();
      alert('Training record updated successfully!');
    } catch (error) {
      console.error('Error updating training record:', error);
      setError('Error updating training record: ' + error.message);
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Training Record</DialogTitle>
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
              label="Employee Name"
              value={form.employee_name}
              disabled
              helperText="Cannot be changed"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              value={form.department}
              disabled
              helperText="Cannot be changed"
            />
          </Grid>

          <Grid item xs={12}>
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
          {loading ? 'Updating...' : 'Update Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
