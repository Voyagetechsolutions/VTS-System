import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddRuleModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    category: '',
    title: '',
    details: '',
    status: 'compliant'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.category || !form.title.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      const { error: insertError } = await supabase.from('compliance_rules').insert([{
        company_id: companyId,
        category: form.category,
        title: form.title.trim(),
        details: form.details.trim() || null,
        status: form.status
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        category: '',
        title: '',
        details: '',
        status: 'compliant'
      });

      onSuccess();
      alert('Compliance rule added successfully!');
    } catch (error) {
      console.error('Error adding compliance rule:', error);
      setError('Error adding compliance rule: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        category: '',
        title: '',
        details: '',
        status: 'compliant'
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Compliance Rule</DialogTitle>
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
                <MenuItem value="compliant">Compliant</MenuItem>
                <MenuItem value="non_compliant">Non-Compliant</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Rule Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              disabled={loading}
              placeholder="Enter a descriptive title for the compliance rule"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Rule Details"
              multiline
              rows={4}
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              disabled={loading}
              placeholder="Provide detailed information about this compliance rule..."
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
          {loading ? 'Adding...' : 'Add Rule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
