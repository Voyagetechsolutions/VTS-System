import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AssignModal({ open, type, item, onClose, onComplete }) {
  const [form, setForm] = useState({
    busId: '',
    driverId: '',
    tripId: ''
  });
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open, type]);

  const loadOptions = async () => {
    try {
      // Load available buses
      const { data: busesData } = await supabase
        .from('buses')
        .select('id, name, license_plate, status')
        .eq('company_id', companyId)
        .in('status', ['Active', 'Available']);

      // Load available drivers
      const { data: driversData } = await supabase
        .from('staff')
        .select('id, name, status')
        .eq('company_id', companyId)
        .eq('role', 'Driver')
        .in('status', ['Active', 'Available']);

      // Load available trips
      const { data: tripsData } = await supabase
        .from('trips')
        .select(`
          id,
          departure,
          arrival,
          route:route_id(pick_up, drop_off),
          status
        `)
        .eq('company_id', companyId)
        .eq('status', 'Scheduled')
        .gte('departure', new Date().toISOString())
        .order('departure');

      setBuses(busesData || []);
      setDrivers(driversData || []);
      setTrips(tripsData || []);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');

      let updateData = {};
      let tableName = '';
      let recordId = '';

      switch (type) {
        case 'trip':
          // Assign bus and/or driver to trip
          updateData = {};
          if (form.busId) updateData.bus_id = form.busId;
          if (form.driverId) updateData.driver_id = form.driverId;
          tableName = 'trips';
          recordId = item.id;
          break;

        case 'bus':
          // Assign bus to trip
          if (!form.tripId) {
            setError('Please select a trip to assign the bus to');
            return;
          }
          updateData = { bus_id: item.id };
          tableName = 'trips';
          recordId = form.tripId;
          break;

        case 'driver':
          // Assign driver to trip
          if (!form.tripId) {
            setError('Please select a trip to assign the driver to');
            return;
          }
          updateData = { driver_id: item.id };
          tableName = 'trips';
          recordId = form.tripId;
          break;

        default:
          setError('Invalid assignment type');
          return;
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', recordId);

      if (updateError) throw updateError;

      // Reset form
      setForm({
        busId: '',
        driverId: '',
        tripId: ''
      });

      onComplete();
    } catch (error) {
      console.error('Error making assignment:', error);
      setError(error.message || 'Failed to make assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setForm({
        busId: '',
        driverId: '',
        tripId: ''
      });
      setError('');
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'trip':
        return `Assign Resources to Trip`;
      case 'bus':
        return `Assign Bus: ${item?.name}`;
      case 'driver':
        return `Assign Driver: ${item?.name}`;
      default:
        return 'Make Assignment';
    }
  };

  const formatTripOption = (trip) => {
    const route = trip.route ? `${trip.route.pick_up} → ${trip.route.drop_off}` : 'Unknown Route';
    const departure = new Date(trip.departure).toLocaleString();
    return `${route} - ${departure}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{getModalTitle()}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {item && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {type === 'trip' && `Trip: ${item.id?.slice(0, 8)}... - ${item.route ? `${item.route.pick_up} → ${item.route.drop_off}` : 'Unknown Route'}`}
                  {type === 'bus' && `Bus: ${item.name} (${item.license_plate})`}
                  {type === 'driver' && `Driver: ${item.name}`}
                </Typography>
              </Box>
            )}
            
            <Grid container spacing={2}>
              {/* For trip assignments, show bus and driver options */}
              {type === 'trip' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Assign Bus</InputLabel>
                      <Select
                        value={form.busId}
                        onChange={(e) => handleChange('busId', e.target.value)}
                        label="Assign Bus"
                        disabled={saving}
                      >
                        <MenuItem value="">No bus assignment</MenuItem>
                        {buses.map((bus) => (
                          <MenuItem key={bus.id} value={bus.id}>
                            {bus.name} ({bus.license_plate}) - {bus.status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Assign Driver</InputLabel>
                      <Select
                        value={form.driverId}
                        onChange={(e) => handleChange('driverId', e.target.value)}
                        label="Assign Driver"
                        disabled={saving}
                      >
                        <MenuItem value="">No driver assignment</MenuItem>
                        {drivers.map((driver) => (
                          <MenuItem key={driver.id} value={driver.id}>
                            {driver.name} - {driver.status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              {/* For bus/driver assignments, show trip options */}
              {(type === 'bus' || type === 'driver') && (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Select Trip</InputLabel>
                    <Select
                      value={form.tripId}
                      onChange={(e) => handleChange('tripId', e.target.value)}
                      label="Select Trip"
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
              )}
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
            {saving ? 'Assigning...' : 'Make Assignment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
