import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Alert, Box
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function EditBranchModal({ open, branch, onClose }) {
  const [form, setForm] = useState({
    name: '',
    location: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (branch) {
      setForm({
        name: branch.name || '',
        location: branch.location || ''
      });
    }
  }, [branch]);

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

      const { error: updateError } = await supabase
        .from('branches')
        .update({
          name: form.name.trim(),
          location: form.location.trim()
        })
        .eq('id', branch.id);

      if (updateError) throw updateError;

      onClose();
    } catch (error) {
      console.error('Error updating branch:', error);
      setError(error.message || 'Failed to update branch');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Branch</DialogTitle>
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
            {saving ? 'Updating...' : 'Update Branch'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
