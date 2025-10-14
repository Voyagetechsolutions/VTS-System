import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Alert, Box, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddMaintenanceModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    bus_id: '',
    bus_name: '',
    date: '',
    type: '',
    cost: '',
    notes: ''
  });
  const [buses, setBuses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (open) {
      loadBuses();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setForm(prev => ({ ...prev, date: today }));
    }
  }, [open]);

  const loadBuses = async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('id, name, license_plate')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setBuses(data || []);
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');

    // If bus is selected, update bus_name
    if (field === 'bus_id') {
      const selectedBus = buses.find(bus => bus.id === value);
      if (selectedBus) {
        setForm(prev => ({ 
          ...prev, 
          bus_id: value,
          bus_name: selectedBus.name || selectedBus.license_plate 
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.bus_id) {
      setError('Please select a bus');
      return;
    }
    
    if (!form.date) {
      setError('Date is required');
      return;
    }

    if (!form.type) {
      setError('Maintenance type is required');
      return;
    }

    if (!form.cost || isNaN(parseFloat(form.cost))) {
      setError('Valid cost is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: insertError } = await supabase
        .from('maintenance_logs')
        .insert([{
          bus_id: form.bus_id,
          bus_name: form.bus_name,
          date: form.date,
          type: form.type,
          cost: parseFloat(form.cost),
          notes: form.notes.trim() || null,
          company_id: companyId
        }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        bus_id: '',
        bus_name: '',
        date: new Date().toISOString().split('T')[0],
        type: '',
        cost: '',
        notes: ''
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding maintenance log:', error);
      setError(error.message || 'Failed to add maintenance log');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setForm({
        bus_id: '',
        bus_name: '',
        date: '',
        type: '',
        cost: '',
        notes: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Maintenance Log</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Bus</InputLabel>
                  <Select
                    value={form.bus_id}
                    onChange={(e) => handleChange('bus_id', e.target.value)}
                    label="Bus"
                    disabled={saving}
                  >
                    {buses.map((bus) => (
                      <MenuItem key={bus.id} value={bus.id}>
                        {bus.name || bus.license_plate}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                  disabled={saving}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    label="Type"
                    disabled={saving}
                  >
                    <MenuItem value="Routine">Routine</MenuItem>
                    <MenuItem value="Major">Major</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cost"
                  value={form.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                  required
                  disabled={saving}
                  placeholder="0.00"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  disabled={saving}
                  placeholder="Optional maintenance notes..."
                  multiline
                  rows={3}
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
            {saving ? 'Adding...' : 'Add Log'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
