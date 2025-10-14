import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, Schedule as ScheduleIcon, CheckCircle as CompletedIcon,
  Cancel as CancelledIcon, DirectionsBus as BusIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import TripsTable from '../components/TripsTable';
import AddTripModal from '../components/AddTripModal';

export default function TripSchedulingHubTab() {
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddTrip, setShowAddTrip] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    bus: '',
    route: '',
    status: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalTrips: 0,
    scheduledTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0
  });

  const loadBuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('id, name, license_plate')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (error) throw error;
      setBuses(data || []);
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  }, [companyId]);

  const loadRoutes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, pick_up, drop_off')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  }, [companyId]);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          bus:bus_id(name, license_plate),
          route:route_id(pick_up, drop_off),
          driver:driver_id(name)
        `)
        .eq('company_id', companyId)
        .order('departure', { ascending: true });

      if (error) throw error;
      setTrips(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: totalTrips },
        { count: scheduledTrips },
        { count: completedTrips },
        { count: cancelledTrips }
      ] = await Promise.all([
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'scheduled'),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'completed'),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'cancelled')
      ]);

      setMetrics({
        totalTrips: totalTrips || 0,
        scheduledTrips: scheduledTrips || 0,
        completedTrips: completedTrips || 0,
        cancelledTrips: cancelledTrips || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadBuses();
    loadRoutes();
    loadTrips();
  }, [loadBuses, loadRoutes, loadTrips]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredTrips = trips.filter(trip => {
    const tripDate = new Date(trip.departure).toISOString().split('T')[0];
    return (
      (!filters.startDate || tripDate >= filters.startDate) &&
      (!filters.endDate || tripDate <= filters.endDate) &&
      (!filters.bus || trip.bus_id === filters.bus) &&
      (!filters.route || trip.route_id === filters.route) &&
      (!filters.status || trip.status === filters.status)
    );
  });

  const handleTripSuccess = () => {
    setShowAddTrip(false);
    loadTrips();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Trip Scheduling
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddTrip(true)}
        >
          Add Trip
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BusIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalTrips}</Typography>
              <Typography variant="body2" color="text.secondary">Total Trips</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.scheduledTrips}</Typography>
              <Typography variant="body2" color="text.secondary">Scheduled</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CompletedIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.completedTrips}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CancelledIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.cancelledTrips}</Typography>
              <Typography variant="body2" color="text.secondary">Cancelled</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Bus</InputLabel>
                <Select
                  value={filters.bus}
                  label="Bus"
                  onChange={(e) => handleFilterChange('bus', e.target.value)}
                >
                  <MenuItem value="">All Buses</MenuItem>
                  {buses.map((bus) => (
                    <MenuItem key={bus.id} value={bus.id}>
                      {bus.name} ({bus.license_plate})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Route</InputLabel>
                <Select
                  value={filters.route}
                  label="Route"
                  onChange={(e) => handleFilterChange('route', e.target.value)}
                >
                  <MenuItem value="">All Routes</MenuItem>
                  {routes.map((route) => (
                    <MenuItem key={route.id} value={route.id}>
                      {route.pick_up} → {route.drop_off}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Trips Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Trip Schedules</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddTrip(true)}
              size="small"
            >
              Add Trip
            </Button>
          </Box>
          {filteredTrips.length === 0 ? (
            <Alert severity="info">
              No schedules found. Add your first trip using the "Add Trip" button.
            </Alert>
          ) : (
            <TripsTable 
              trips={filteredTrips} 
              loading={loading}
              onUpdate={loadTrips}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Trip Modal */}
      <AddTripModal
        open={showAddTrip}
        onClose={() => setShowAddTrip(false)}
        onSuccess={handleTripSuccess}
        buses={buses}
        routes={routes}
      />
    </Box>
  );
}
