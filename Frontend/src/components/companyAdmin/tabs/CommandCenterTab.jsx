import React, { useEffect, useState } from 'react';
import { Grid, Button, Typography, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem } from '@mui/material';
import DashboardCard, { StatsCard, QuickActionCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import CommandCenterMap from './CommandCenterMap';
import {
  getCompanyDashboardKPIs,
  getCompanyAlertsFeed,
  getCompanyRoutes,
  getCompanyBuses,
  getDrivers,
  assignBusToRoute,
  createRoute,
  assignDriver,
  getLargeRefunds,
  getAdminOversightSnapshot,
  getOpenIncidentsCount,
} from '../../../supabase/api';

export default function CommandCenterTab() {
  const [kpis, setKpis] = useState({ activeTrips: 0, passengersToday: 0, revenueToday: 0, incidentsOpen: 0, refundsPending: 0, staffUtilization: 0 });
  const [alerts, setAlerts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [addBusOpen, setAddBusOpen] = useState(false);
  const [addBusForm, setAddBusForm] = useState({ route_id: '', bus_id: '' });
  const [addRouteOpen, setAddRouteOpen] = useState(false);
  const [addRouteForm, setAddRouteForm] = useState({ origin: '', destination: '', departure_time: '', arrival_time: '', arrival_day: 'same_day', route_code: '' });
  const [assignOpen, setAssignOpen] = useState(false);
  // const [addNewBusOpen, setAddNewBusOpen] = useState(false); // TODO: Implement add bus functionality
  const [drivers, setDrivers] = useState([]);
  const [assignForm, setAssignForm] = useState({ driver_id: '', bus_id: '', route_id: '' });

  const loadDashboard = async () => {
    try {
      const [r, snapshot, refunds, openInc] = await Promise.all([
        getCompanyDashboardKPIs(),
        getAdminOversightSnapshot(),
        getLargeRefunds(),
        getOpenIncidentsCount(),
      ]);
      const base = r?.data || {};
      const staffUtil = Number(snapshot?.data?.ops?.utilizationPct || snapshot?.data?.utilization?.pct || 0);
      const refundsPending = Array.isArray(refunds?.data) ? refunds.data.length : Number(refunds?.data || 0);
      const incidentsOpen = Number(openInc?.data || base.incidentsOpen || 0);
      setKpis(k => ({
        ...k,
        activeTrips: Number(base.activeTrips || 0),
        passengersToday: Number(base.passengersToday || 0),
        revenueToday: Number(base.revenueToday || 0),
        incidentsOpen,
        refundsPending,
        staffUtilization: staffUtil,
      }));
    } catch (error) { console.error('Failed to load KPIs:', error); }
    try {
      const a = await getCompanyAlertsFeed();
      setAlerts(a.data || []);
    } catch (error) { console.error('Failed to load alerts:', error); }
    try {
      const [{ data: routeList }, { data: busList }, { data: driverList }] = await Promise.all([
        getCompanyRoutes(), getCompanyBuses(), getDrivers()
      ]);
      setRoutes(routeList || []);
      setBuses(busList || []);
      setDrivers(driverList || []);
    } catch (error) { console.error('Failed to load data:', error); }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadDashboard();
    };
    loadData();
    const onOpenAddBus = () => setAddBusOpen(true);
    const onOpenAddRoute = () => setAddRouteOpen(true);
    const onOpenAssign = () => setAssignOpen(true);
    const onOpenAddNewBus = () => setAddNewBusOpen(true);
    window.addEventListener('open-add-bus-to-route', onOpenAddBus);
    window.addEventListener('open-add-route', onOpenAddRoute);
    window.addEventListener('open-assign-driver', onOpenAssign);
    window.addEventListener('open-add-bus', onOpenAddNewBus);
    const t = setInterval(loadDashboard, 30000);
    return () => {
      window.removeEventListener('open-add-bus-to-route', onOpenAddBus);
      window.removeEventListener('open-add-route', onOpenAddRoute);
      window.removeEventListener('open-assign-driver', onOpenAssign);
      window.removeEventListener('open-add-bus', onOpenAddNewBus);
      clearInterval(t);
    };
  }, []);

  const actions = [
    { label: 'Add Bus to Route', icon: 'route_add', onClick: () => window.dispatchEvent(new CustomEvent('open-add-bus-to-route')) },
    { label: 'Add Route', icon: 'route', onClick: () => window.dispatchEvent(new CustomEvent('open-add-route')) },
    { label: 'Assign Driver', icon: 'driver', onClick: () => window.dispatchEvent(new CustomEvent('open-assign-driver')) },
    { label: 'Add Bus', icon: 'bus', onClick: () => setAddNewBusOpen(true) },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DashboardCard title="Live Map" variant="elevated">
          <CommandCenterMap />
        </DashboardCard>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}><StatsCard title="Active Trips" value={kpis.activeTrips} icon="trips" color="info" /></Grid>
          <Grid item xs={12} sm={6} md={2}><StatsCard title="Passengers Today" value={kpis.passengersToday} icon="passengers" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={2}><StatsCard title="Revenue Today" value={`$${Number(kpis.revenueToday||0).toLocaleString()}`} icon="revenue" color="success" /></Grid>
          <Grid item xs={12} sm={6} md={2}><StatsCard title="Open Incidents" value={kpis.incidentsOpen} icon="incident" color="warning" /></Grid>
          <Grid item xs={12} sm={6} md={2}><StatsCard title="Refunds Pending" value={kpis.refundsPending} icon="money" color="secondary" /></Grid>
          <Grid item xs={12} sm={6} md={2}><StatsCard title="Staff Utilization" value={`${Number(kpis.staffUtilization||0)}%`} icon="users" color="info" /></Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4}>
        <QuickActionCard title="Quick Actions" actions={actions} />
      </Grid>
      <Grid item xs={12} md={8}>
        <DashboardCard title="Recent Activity">
          <DataTable
            pagination={true}
            data={(alerts||[]).map(a => ({
              event: a.event || a.type || a.title || a.action || 'Activity',
              category: a.category || a.module || a.scope || '-',
              date: a.created_at || a.timestamp || a.date || null,
              status: a.status || a.level || a.result || '-',
            }))}
            columns={[
              { field: 'event', headerName: 'Event' },
              { field: 'category', headerName: 'Category' },
              { field: 'date', headerName: 'Date', type: 'date' },
              { field: 'status', headerName: 'Status', type: 'status' },
            ]}
            emptyMessage="No recent activity"
          />
        </DashboardCard>
      </Grid>

      {/* Add Bus to Route Dialog */}
      <Dialog open={addBusOpen} onClose={() => setAddBusOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Bus to Route</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Select displayEmpty value={addBusForm.route_id} onChange={e => setAddBusForm(f => ({ ...f, route_id: e.target.value }))}>
              <MenuItem value="">Select Route...</MenuItem>
              {routes.map(r => (
                <MenuItem key={r.route_id} value={r.route_id}>
                  {r.origin} → {r.destination}
                </MenuItem>
              ))}
            </Select>
            <Select displayEmpty value={addBusForm.bus_id} onChange={e => setAddBusForm(f => ({ ...f, bus_id: e.target.value }))}>
              <MenuItem value="">Select Bus...</MenuItem>
              {buses.map(b => (<MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate} ({b.status||'Unknown'})</MenuItem>))}
            </Select>
            <Typography variant="body2" color="text.secondary">
              Assigns the selected bus to the chosen route.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBusOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (addBusForm.route_id && addBusForm.bus_id) { await assignBusToRoute(addBusForm.bus_id, addBusForm.route_id); setAddBusOpen(false); } }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add Route Dialog */}
      <Dialog open={addRouteOpen} onClose={() => setAddRouteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Route</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Pick up (Origin)" value={addRouteForm.origin} onChange={e => setAddRouteForm(f => ({ ...f, origin: e.target.value }))} fullWidth />
            <TextField label="Drop off (Destination)" value={addRouteForm.destination} onChange={e => setAddRouteForm(f => ({ ...f, destination: e.target.value }))} fullWidth />
            <TextField label="Departure" type="time" value={addRouteForm.departure_time} onChange={e => setAddRouteForm(f => ({ ...f, departure_time: e.target.value }))} fullWidth />
            <TextField label="Arrival" type="time" value={addRouteForm.arrival_time} onChange={e => setAddRouteForm(f => ({ ...f, arrival_time: e.target.value }))} fullWidth />
            <Select fullWidth value={addRouteForm.arrival_day} onChange={e => setAddRouteForm(f => ({ ...f, arrival_day: e.target.value }))}>
              <MenuItem value="same_day">Arrival Day: Same Day</MenuItem>
              <MenuItem value="next_day">Arrival Day: Next Day</MenuItem>
            </Select>
            <TextField label="Route ID/Code" value={addRouteForm.route_code} onChange={e => setAddRouteForm(f => ({ ...f, route_code: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRouteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { const payload = { origin: addRouteForm.origin, destination: addRouteForm.destination, departure_times: addRouteForm.departure_time ? [addRouteForm.departure_time] : [], arrival_times: addRouteForm.arrival_time ? [addRouteForm.arrival_time] : [], arrival_day: addRouteForm.arrival_day, frequency: 'Daily', route_code: addRouteForm.route_code || null }; await createRoute(payload); setAddRouteOpen(false); }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Select displayEmpty value={assignForm.driver_id} onChange={e => setAssignForm(f => ({ ...f, driver_id: e.target.value }))}>
              <MenuItem value="">Select Driver...</MenuItem>
              {drivers.map(d => (<MenuItem key={d.driver_id} value={d.driver_id}>{d.name}</MenuItem>))}
            </Select>
            <Select displayEmpty value={assignForm.bus_id} onChange={e => setAssignForm(f => ({ ...f, bus_id: e.target.value }))}>
              <MenuItem value="">Select Bus...</MenuItem>
              {buses.map(b => (<MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>))}
            </Select>
            <Select displayEmpty value={assignForm.route_id} onChange={e => setAssignForm(f => ({ ...f, route_id: e.target.value }))}>
              <MenuItem value="">Select Route...</MenuItem>
              {routes.map(r => (<MenuItem key={r.route_id} value={r.route_id}>{r.origin} → {r.destination}</MenuItem>))}
            </Select>
            <Typography variant="body2" color="text.secondary">Assigns driver to bus and schedule (route)</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (assignForm.driver_id && assignForm.route_id) { await assignDriver(assignForm.driver_id, assignForm.route_id, assignForm.bus_id || null); setAssignOpen(false); } }}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
