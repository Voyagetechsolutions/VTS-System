import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Alert, Box
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddBranchModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    location: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError('Branch name is required');
      return;
    }
    
    if (!form.location.trim()) {
      setError('Location is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: insertError } = await supabase
        .from('branches')
        .insert([{
          name: form.name.trim(),
          location: form.location.trim(),
          company_id: companyId
        }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        name: '',
        location: ''
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding branch:', error);
      setError(error.message || 'Failed to add branch');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setForm({
        name: '',
        location: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Branch</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  disabled={saving}
                  placeholder="Enter branch name"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  required
                  disabled={saving}
                  placeholder="Enter branch location/address"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={saving}
          >
            {saving ? 'Adding...' : 'Add Branch'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
