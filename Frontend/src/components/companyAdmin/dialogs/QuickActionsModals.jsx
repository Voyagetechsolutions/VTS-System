import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert, Stack
} from '@mui/material';
// Using regular input fields instead of MUI date pickers
import { supabase } from '../../../supabase/client';

export default function QuickActionsModals() {
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddBusToRoute, setShowAddBusToRoute] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [showAddBus, setShowAddBus] = useState(false);

  // Data states
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Form states
  const [busToRouteForm, setBusToRouteForm] = useState({
    bus_id: '',
    route_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [routeForm, setRouteForm] = useState({
    name: '',
    origin: '',
    destination: '',
    distance: '',
    duration: '',
    fare: '',
    status: 'Active'
  });

  const [driverAssignForm, setDriverAssignForm] = useState({
    driver_id: '',
    bus_id: '',
    route_id: '',
    shift_start: new Date().toISOString().slice(0, 16),
    shift_end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  const [busForm, setBusForm] = useState({
    name: '',
    plate_number: '',
    capacity: '',
    model: '',
    status: 'Active'
  });

  // Load data
  useEffect(() => {
    loadBuses();
    loadRoutes();
    loadDrivers();

    // Listen for custom events from Overview tab
    const handleOpenBusToRoute = () => setShowAddBusToRoute(true);
    const handleOpenAddRoute = () => setShowAddRoute(true);
    const handleOpenAssignDriver = () => setShowAssignDriver(true);
    const handleOpenAddBus = () => setShowAddBus(true);

    window.addEventListener('open-add-bus-to-route', handleOpenBusToRoute);
    window.addEventListener('open-add-route', handleOpenAddRoute);
    window.addEventListener('open-assign-driver', handleOpenAssignDriver);
    window.addEventListener('open-add-bus', handleOpenAddBus);

    return () => {
      window.removeEventListener('open-add-bus-to-route', handleOpenBusToRoute);
      window.removeEventListener('open-add-route', handleOpenAddRoute);
      window.removeEventListener('open-assign-driver', handleOpenAssignDriver);
      window.removeEventListener('open-add-bus', handleOpenAddBus);
    };
  }, []);

  const loadBuses = async () => {
    try {
      const { data } = await supabase
        .from('buses')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'Active');
      setBuses(data || []);
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  };

  const loadRoutes = async () => {
    try {
      const { data } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', companyId);
      setRoutes(data || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const { data } = await supabase
        .from('drivers')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'Active');
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleAddBusToRoute = async () => {
    try {
      if (!busToRouteForm.bus_id || !busToRouteForm.route_id) {
        alert('Please select both bus and route');
        return;
      }

      const { error } = await supabase.from('bus_routes').insert([{
        bus_id: busToRouteForm.bus_id,
        route_id: busToRouteForm.route_id,
        start_date: busToRouteForm.start_date,
        end_date: busToRouteForm.end_date,
        company_id: companyId
      }]);

      if (error) throw error;

      setShowAddBusToRoute(false);
      setBusToRouteForm({
        bus_id: '',
        route_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      alert('Bus successfully assigned to route!');
    } catch (error) {
      console.error('Error assigning bus to route:', error);
      alert('Error assigning bus to route: ' + error.message);
    }
  };

  const handleAddRoute = async () => {
    try {
      if (!routeForm.name || !routeForm.origin || !routeForm.destination) {
        alert('Please fill in route name, origin, and destination');
        return;
      }

      const { error } = await supabase.from('routes').insert([{
        name: routeForm.name,
        origin: routeForm.origin,
        destination: routeForm.destination,
        distance: parseFloat(routeForm.distance) || 0,
        duration: parseFloat(routeForm.duration) || 0,
        fare: parseFloat(routeForm.fare) || 0,
        status: routeForm.status,
        company_id: companyId
      }]);

      if (error) throw error;

      setShowAddRoute(false);
      setRouteForm({
        name: '',
        origin: '',
        destination: '',
        distance: '',
        duration: '',
        fare: '',
        status: 'Active'
      });
      loadRoutes(); // Refresh routes list
      alert('New route added successfully!');
    } catch (error) {
      console.error('Error adding route:', error);
      alert('Error adding route: ' + error.message);
    }
  };

  const handleAssignDriver = async () => {
    try {
      if (!driverAssignForm.driver_id || !driverAssignForm.bus_id || !driverAssignForm.route_id) {
        alert('Please select driver, bus, and route');
        return;
      }

      const { error } = await supabase.from('driver_assignments').insert([{
        driver_id: driverAssignForm.driver_id,
        bus_id: driverAssignForm.bus_id,
        route_id: driverAssignForm.route_id,
        shift_start: new Date(driverAssignForm.shift_start).toISOString(),
        shift_end: new Date(driverAssignForm.shift_end).toISOString(),
        company_id: companyId
      }]);

      if (error) throw error;

      setShowAssignDriver(false);
      setDriverAssignForm({
        driver_id: '',
        bus_id: '',
        route_id: '',
        shift_start: new Date().toISOString().slice(0, 16),
        shift_end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
      alert('Driver assigned successfully!');
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Error assigning driver: ' + error.message);
    }
  };

  const handleAddBus = async () => {
    try {
      if (!busForm.name || !busForm.plate_number || !busForm.capacity) {
        alert('Please fill in bus name, plate number, and capacity');
        return;
      }

      const { error } = await supabase.from('buses').insert([{
        name: busForm.name,
        plate_number: busForm.plate_number,
        capacity: parseInt(busForm.capacity),
        model: busForm.model,
        status: busForm.status,
        company_id: companyId
      }]);

      if (error) throw error;

      setShowAddBus(false);
      setBusForm({
        name: '',
        plate_number: '',
        capacity: '',
        model: '',
        status: 'Active'
      });
      loadBuses(); // Refresh buses list
      alert('Bus added successfully!');
    } catch (error) {
      console.error('Error adding bus:', error);
      alert('Error adding bus: ' + error.message);
    }
  };

  return (
    <>
      {/* Add Bus to Route Modal */}
      <Dialog open={showAddBusToRoute} onClose={() => setShowAddBusToRoute(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Bus to Route</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Bus</InputLabel>
                <Select
                  value={busToRouteForm.bus_id}
                  label="Select Bus"
                  onChange={(e) => setBusToRouteForm({ ...busToRouteForm, bus_id: e.target.value })}
                >
                  {buses.map((bus) => (
                    <MenuItem key={bus.id} value={bus.id}>
                      {bus.name} - {bus.plate_number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Route</InputLabel>
                <Select
                  value={busToRouteForm.route_id}
                  label="Select Route"
                  onChange={(e) => setBusToRouteForm({ ...busToRouteForm, route_id: e.target.value })}
                >
                  {routes.map((route) => (
                    <MenuItem key={route.id} value={route.id}>
                      {route.name} ({route.origin} → {route.destination})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={busToRouteForm.start_date}
                onChange={(e) => setBusToRouteForm({ ...busToRouteForm, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={busToRouteForm.end_date}
                onChange={(e) => setBusToRouteForm({ ...busToRouteForm, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddBusToRoute(false)}>Cancel</Button>
          <Button onClick={handleAddBusToRoute} variant="contained">Assign Bus</Button>
        </DialogActions>
      </Dialog>

      {/* Add Route Modal */}
      <Dialog open={showAddRoute} onClose={() => setShowAddRoute(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Route</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Route Name"
                value={routeForm.name}
                onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Origin"
                value={routeForm.origin}
                onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destination"
                value={routeForm.destination}
                onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Distance (km)"
                type="number"
                value={routeForm.distance}
                onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Duration (hrs)"
                type="number"
                step="0.5"
                value={routeForm.duration}
                onChange={(e) => setRouteForm({ ...routeForm, duration: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Fare"
                type="number"
                step="0.01"
                value={routeForm.fare}
                onChange={(e) => setRouteForm({ ...routeForm, fare: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={routeForm.status}
                  label="Status"
                  onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddRoute(false)}>Cancel</Button>
          <Button onClick={handleAddRoute} variant="contained">Add Route</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Driver Modal */}
      <Dialog open={showAssignDriver} onClose={() => setShowAssignDriver(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Driver</InputLabel>
                <Select
                  value={driverAssignForm.driver_id}
                  label="Select Driver"
                  onChange={(e) => setDriverAssignForm({ ...driverAssignForm, driver_id: e.target.value })}
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name} - {driver.license_number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Bus</InputLabel>
                <Select
                  value={driverAssignForm.bus_id}
                  label="Select Bus"
                  onChange={(e) => setDriverAssignForm({ ...driverAssignForm, bus_id: e.target.value })}
                >
                  {buses.map((bus) => (
                    <MenuItem key={bus.id} value={bus.id}>
                      {bus.name} - {bus.plate_number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Route</InputLabel>
                <Select
                  value={driverAssignForm.route_id}
                  label="Select Route"
                  onChange={(e) => setDriverAssignForm({ ...driverAssignForm, route_id: e.target.value })}
                >
                  {routes.map((route) => (
                    <MenuItem key={route.id} value={route.id}>
                      {route.name} ({route.origin} → {route.destination})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shift Start"
                type="datetime-local"
                value={driverAssignForm.shift_start}
                onChange={(e) => setDriverAssignForm({ ...driverAssignForm, shift_start: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shift End"
                type="datetime-local"
                value={driverAssignForm.shift_end}
                onChange={(e) => setDriverAssignForm({ ...driverAssignForm, shift_end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDriver(false)}>Cancel</Button>
          <Button onClick={handleAssignDriver} variant="contained">Assign Driver</Button>
        </DialogActions>
      </Dialog>

      {/* Add Bus Modal */}
      <Dialog open={showAddBus} onClose={() => setShowAddBus(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Bus</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bus Name"
                value={busForm.name}
                onChange={(e) => setBusForm({ ...busForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plate Number"
                value={busForm.plate_number}
                onChange={(e) => setBusForm({ ...busForm, plate_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={busForm.capacity}
                onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={busForm.model}
                onChange={(e) => setBusForm({ ...busForm, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={busForm.status}
                  label="Status"
                  onChange={(e) => setBusForm({ ...busForm, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddBus(false)}>Cancel</Button>
          <Button onClick={handleAddBus} variant="contained">Add Bus</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
