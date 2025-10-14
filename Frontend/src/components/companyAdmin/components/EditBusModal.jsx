import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert, Checkbox,
  FormControlLabel
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function EditBusModal({ open, onClose, onSuccess, bus }) {
  const [form, setForm] = useState({
    name: '',
    type: '',
    model: '',
    license_plate: '',
    capacity: '',
    status: 'active',
    health: '',
    last_check: '',
    config: '',
    insurance: false,
    insured: false,
    permit: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (bus && open) {
      setForm({
        name: bus.name || '',
        type: bus.type || '',
        model: bus.model || '',
        license_plate: bus.license_plate || '',
        capacity: bus.capacity?.toString() || '',
        status: bus.status || 'active',
        health: bus.health?.toString() || '',
        last_check: bus.last_check || '',
        config: bus.config || '',
        insurance: bus.insurance || false,
        insured: bus.insured || false,
        permit: bus.permit || ''
      });
    }
  }, [bus, open]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.name || !form.license_plate || !form.capacity) {
        setError('Please fill in all required fields (Name, License Plate, Capacity)');
        return;
      }

      // Check if license plate already exists (excluding current bus)
      const { data: existingBus } = await supabase
        .from('buses')
        .select('id')
        .eq('license_plate', form.license_plate)
        .eq('company_id', companyId)
        .neq('id', bus.id)
        .single();

      if (existingBus) {
        setError('A bus with this license plate already exists');
        return;
      }

      const { error: updateError } = await supabase
        .from('buses')
        .update({
          name: form.name,
          type: form.type || null,
          model: form.model || null,
          license_plate: form.license_plate,
          capacity: parseInt(form.capacity),
          status: form.status,
          health: form.health ? parseFloat(form.health) : null,
          last_check: form.last_check || null,
          config: form.config || null,
          insurance: form.insurance,
          insured: form.insured,
          permit: form.permit || null
        })
        .eq('id', bus.id);

      if (updateError) throw updateError;

      onSuccess();
      alert('Bus updated successfully!');
    } catch (error) {
      console.error('Error updating bus:', error);
      setError('Error updating bus: ' + error.message);
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
      <DialogTitle>Edit Bus</DialogTitle>
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
              label="Bus Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={form.type}
                label="Type"
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="luxury">Luxury</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="economy">Economy</MenuItem>
                <MenuItem value="express">Express</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="License Plate"
              value={form.license_plate}
              onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Capacity (seats)"
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
              disabled={loading}
              inputProps={{ min: 1, max: 100 }}
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
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Health Score (%)"
              type="number"
              value={form.health}
              onChange={(e) => setForm({ ...form, health: e.target.value })}
              disabled={loading}
              inputProps={{ min: 0, max: 100 }}
              helperText="Optional health score (0-100)"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Check Date"
              type="date"
              value={form.last_check}
              onChange={(e) => setForm({ ...form, last_check: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Seating Configuration"
              value={form.config}
              onChange={(e) => setForm({ ...form, config: e.target.value })}
              disabled={loading}
              placeholder="e.g., 2x2, 3x2"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Permit Number"
              value={form.permit}
              onChange={(e) => setForm({ ...form, permit: e.target.value })}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.insurance}
                  onChange={(e) => setForm({ ...form, insurance: e.target.checked })}
                  disabled={loading}
                />
              }
              label="Has Insurance"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.insured}
                  onChange={(e) => setForm({ ...form, insured: e.target.checked })}
                  disabled={loading}
                />
              }
              label="Insurance Confirmed"
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
          {loading ? 'Updating...' : 'Update Bus'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
