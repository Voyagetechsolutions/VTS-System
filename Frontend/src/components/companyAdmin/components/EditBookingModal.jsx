import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Alert, Box, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function EditBookingModal({ open, booking, onClose }) {
  const [form, setForm] = useState({
    trip_id: '',
    passenger_name: '',
    seat_number: '',
    branch_id: '',
    channel: '',
    status: ''
  });
  const [trips, setTrips] = useState([]);
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (open) {
      loadTrips();
      loadBranches();
    }
  }, [open]);

  useEffect(() => {
    if (booking) {
      setForm({
        trip_id: booking.trip?.id || '',
        passenger_name: booking.passenger_name || '',
        seat_number: booking.seat_number || '',
        branch_id: booking.branch_id || '',
        channel: booking.channel || '',
        status: booking.status || ''
      });
    }
  }, [booking]);

  const loadTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          departure,
          arrival,
          route:route_id(pick_up, drop_off),
          bus:bus_id(name, license_plate)
        `)
        .eq('company_id', companyId)
        .order('departure');

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.trip_id) {
      setError('Please select a trip');
      return;
    }
    
    if (!form.passenger_name.trim()) {
      setError('Passenger name is required');
      return;
    }

    if (!form.seat_number.trim()) {
      setError('Seat number is required');
      return;
    }

    if (!form.branch_id) {
      setError('Please select a branch');
      return;
    }

    if (!form.channel) {
      setError('Please select a channel');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          trip_id: form.trip_id,
          passenger_name: form.passenger_name.trim(),
          seat_number: form.seat_number.trim(),
          branch_id: form.branch_id,
          channel: form.channel,
          status: form.status
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      setError(error.message || 'Failed to update booking');
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

  const formatTripOption = (trip) => {
    const route = trip.route ? `${trip.route.pick_up} → ${trip.route.drop_off}` : 'Unknown Route';
    const departure = new Date(trip.departure).toLocaleString();
    const bus = trip.bus?.name || trip.bus?.license_plate || 'Unknown Bus';
    return `${route} - ${departure} (${bus})`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Booking</DialogTitle>
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
                  <InputLabel>Trip</InputLabel>
                  <Select
                    value={form.trip_id}
                    onChange={(e) => handleChange('trip_id', e.target.value)}
                    label="Trip"
                    disabled={saving}
                  >
                    {trips.map((trip) => (
                      <MenuItem key={trip.id} value={trip.id}>
                        {formatTripOption(trip)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Passenger Name"
                  value={form.passenger_name}
                  onChange={(e) => handleChange('passenger_name', e.target.value)}
                  required
                  disabled={saving}
                  placeholder="Enter passenger name"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Seat Number"
                  value={form.seat_number}
                  onChange={(e) => handleChange('seat_number', e.target.value)}
                  required
                  disabled={saving}
                  placeholder="e.g., A1, B5"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Branch</InputLabel>
                  <Select
                    value={form.branch_id}
                    onChange={(e) => handleChange('branch_id', e.target.value)}
                    label="Branch"
                    disabled={saving}
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Channel</InputLabel>
                  <Select
                    value={form.channel}
                    onChange={(e) => handleChange('channel', e.target.value)}
                    label="Channel"
                    disabled={saving}
                  >
                    <MenuItem value="Web">Web</MenuItem>
                    <MenuItem value="App">App</MenuItem>
                    <MenuItem value="Counter">Counter</MenuItem>
                    <MenuItem value="Agent">Agent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    label="Status"
                    disabled={saving}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
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
            {saving ? 'Updating...' : 'Update Booking'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
