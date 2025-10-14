import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function ReportIncidentModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    description: '',
    category: '',
    status: 'open'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');
  const currentUserId = window.userId || localStorage.getItem('userId');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.description.trim() || !form.category) {
        setError('Please fill in all required fields');
        return;
      }

      const { error: insertError } = await supabase.from('safety_logs').insert([{
        company_id: companyId,
        description: form.description.trim(),
        category: form.category,
        status: form.status,
        reported_by: currentUserId,
        reported_at: new Date().toISOString()
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        description: '',
        category: '',
        status: 'open'
      });

      onSuccess();
      alert('Safety incident reported successfully!');
    } catch (error) {
      console.error('Error reporting incident:', error);
      setError('Error reporting incident: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        description: '',
        category: '',
        status: 'open'
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Report Safety Incident</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category}
                label="Category"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="vehicle">Vehicle</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="health">Health</MenuItem>
                <MenuItem value="passenger">Passenger</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>
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
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Incident Description"
              multiline
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              disabled={loading}
              placeholder="Provide a detailed description of the safety incident or compliance issue..."
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
          {loading ? 'Reporting...' : 'Report Incident'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
