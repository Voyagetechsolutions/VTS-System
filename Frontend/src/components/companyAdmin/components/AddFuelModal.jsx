import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Alert, Box, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddFuelModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    bus_id: '',
    bus_name: '',
    date: '',
    liters: '',
    cost: '',
    station: ''
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

    if (!form.liters || isNaN(parseFloat(form.liters))) {
      setError('Valid liters amount is required');
      return;
    }

    if (!form.cost || isNaN(parseFloat(form.cost))) {
      setError('Valid cost is required');
      return;
    }

    if (!form.station.trim()) {
      setError('Station name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: insertError } = await supabase
        .from('fuel_logs')
        .insert([{
          bus_id: form.bus_id,
          bus_name: form.bus_name,
          date: form.date,
          liters: parseFloat(form.liters),
          cost: parseFloat(form.cost),
          station: form.station.trim(),
          company_id: companyId
        }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        bus_id: '',
        bus_name: '',
        date: new Date().toISOString().split('T')[0],
        liters: '',
        cost: '',
        station: ''
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding fuel log:', error);
      setError(error.message || 'Failed to add fuel log');
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
        liters: '',
        cost: '',
        station: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Fuel Record</DialogTitle>
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
                <TextField
                  fullWidth
                  type="number"
                  label="Liters"
                  value={form.liters}
                  onChange={(e) => handleChange('liters', e.target.value)}
                  required
                  disabled={saving}
                  placeholder="0.0"
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Station"
                  value={form.station}
                  onChange={(e) => handleChange('station', e.target.value)}
                  required
                  disabled={saving}
                  placeholder="Fuel station name"
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
            {saving ? 'Adding...' : 'Add Record'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
