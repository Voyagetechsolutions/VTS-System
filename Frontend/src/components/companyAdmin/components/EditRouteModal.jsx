import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert, Chip, Box
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function EditRouteModal({ open, onClose, onSuccess, route }) {
  const [form, setForm] = useState({
    name: '',
    pick_up: '',
    drop_off: '',
    departure_times: [],
    arrival_times: [],
    frequency: '',
    price: '',
    status: 'active'
  });
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (route && open) {
      setForm({
        name: route.name || '',
        pick_up: route.pick_up || '',
        drop_off: route.drop_off || '',
        departure_times: route.departure_times || [],
        arrival_times: route.arrival_times || [],
        frequency: route.frequency?.toString() || '',
        price: route.price?.toString() || '',
        status: route.status || 'active'
      });
    }
  }, [route, open]);

  const addDepartureTime = () => {
    if (departureTime && !form.departure_times.includes(departureTime)) {
      setForm(prev => ({
        ...prev,
        departure_times: [...prev.departure_times, departureTime]
      }));
      setDepartureTime('');
    }
  };

  const addArrivalTime = () => {
    if (arrivalTime && !form.arrival_times.includes(arrivalTime)) {
      setForm(prev => ({
        ...prev,
        arrival_times: [...prev.arrival_times, arrivalTime]
      }));
      setArrivalTime('');
    }
  };

  const removeDepartureTime = (timeToRemove) => {
    setForm(prev => ({
      ...prev,
      departure_times: prev.departure_times.filter(time => time !== timeToRemove)
    }));
  };

  const removeArrivalTime = (timeToRemove) => {
    setForm(prev => ({
      ...prev,
      arrival_times: prev.arrival_times.filter(time => time !== timeToRemove)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.pick_up || !form.drop_off || !form.price || !form.frequency) {
        setError('Please fill in all required fields');
        return;
      }

      if (form.departure_times.length === 0) {
        setError('Please add at least one departure time');
        return;
      }

      if (form.arrival_times.length === 0) {
        setError('Please add at least one arrival time');
        return;
      }

      const { error: updateError } = await supabase
        .from('routes')
        .update({
          name: form.name || null,
          pick_up: form.pick_up,
          drop_off: form.drop_off,
          departure_times: form.departure_times,
          arrival_times: form.arrival_times,
          frequency: parseInt(form.frequency),
          price: parseFloat(form.price),
          status: form.status
        })
        .eq('id', route.id);

      if (updateError) throw updateError;

      onSuccess();
      alert('Route updated successfully!');
    } catch (error) {
      console.error('Error updating route:', error);
      setError('Error updating route: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setDepartureTime('');
      setArrivalTime('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Route</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Route Name (Optional)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={loading}
              helperText="Optional display name for the route"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pick Up Location"
              value={form.pick_up}
              onChange={(e) => setForm({ ...form, pick_up: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Drop Off Location"
              value={form.drop_off}
              onChange={(e) => setForm({ ...form, drop_off: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Departure Time"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                size="small"
              />
              <Button onClick={addDepartureTime} variant="outlined" size="small">
                Add
              </Button>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {form.departure_times.map((time, index) => (
                <Chip
                  key={index}
                  label={time}
                  onDelete={() => removeDepartureTime(time)}
                  size="small"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Arrival Time"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                size="small"
              />
              <Button onClick={addArrivalTime} variant="outlined" size="small">
                Add
              </Button>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {form.arrival_times.map((time, index) => (
                <Chip
                  key={index}
                  label={time}
                  onDelete={() => removeArrivalTime(time)}
                  size="small"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Frequency (trips per day)"
              type="number"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              required
              disabled={loading}
              inputProps={{ min: 1, max: 50 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                label="Status"
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
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
          {loading ? 'Updating...' : 'Update Route'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
