import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddTripModal({ open, onClose, onSuccess, buses, routes }) {
  const [form, setForm] = useState({
    bus_id: '',
    route_id: '',
    departure: '',
    arrival: '',
    status: 'scheduled',
    driver_id: ''
  });
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (open) {
      loadDrivers();
    }
  }, [open]);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name')
        .eq('company_id', companyId)
        .eq('role', 'driver')
        .eq('is_active', true);

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.bus_id || !form.route_id || !form.departure || !form.arrival) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate that arrival is after departure
      if (new Date(form.arrival) <= new Date(form.departure)) {
        setError('Arrival time must be after departure time');
        return;
      }

      const { error: insertError } = await supabase.from('trips').insert([{
        company_id: companyId,
        bus_id: form.bus_id,
        route_id: form.route_id,
        departure: new Date(form.departure).toISOString(),
        arrival: new Date(form.arrival).toISOString(),
        status: form.status,
        driver_id: form.driver_id || null
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        bus_id: '',
        route_id: '',
        departure: '',
        arrival: '',
        status: 'scheduled',
        driver_id: ''
      });

      onSuccess();
      alert('Trip scheduled successfully!');
    } catch (error) {
      console.error('Error adding trip:', error);
      setError('Error adding trip: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        bus_id: '',
        route_id: '',
        departure: '',
        arrival: '',
        status: 'scheduled',
        driver_id: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Schedule New Trip</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Bus</InputLabel>
              <Select
                value={form.bus_id}
                label="Bus"
                onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
                disabled={loading}
              >
                {buses.map((bus) => (
                  <MenuItem key={bus.id} value={bus.id}>
                    {bus.name} ({bus.license_plate})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Route</InputLabel>
              <Select
                value={form.route_id}
                label="Route"
                onChange={(e) => setForm({ ...form, route_id: e.target.value })}
                disabled={loading}
              >
                {routes.map((route) => (
                  <MenuItem key={route.id} value={route.id}>
                    {route.pick_up} → {route.drop_off}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Departure Date & Time"
              type="datetime-local"
              value={form.departure}
              onChange={(e) => setForm({ ...form, departure: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Arrival Date & Time"
              type="datetime-local"
              value={form.arrival}
              onChange={(e) => setForm({ ...form, arrival: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Assign Driver</InputLabel>
              <Select
                value={form.driver_id}
                label="Assign Driver"
                onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {drivers.map((driver) => (
                  <MenuItem key={driver.user_id} value={driver.user_id}>
                    {driver.name}
                  </MenuItem>
                ))}
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
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
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
          {loading ? 'Scheduling...' : 'Schedule Trip'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
