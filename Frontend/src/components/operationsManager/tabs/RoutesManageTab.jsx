import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Button, Stack, TextField } from '@mui/material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';
import { subscribeToTrips } from '../../../supabase/realtime';
import { upsertTripSchedule, updateTripStatus, createIncident, createAnnouncement, sendMessage } from '../../../supabase/api';

export default function RoutesManageTab() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeSearch, setRouteSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('trips_with_details')
      .select('trip_id, route_name, route_id, bus_id, driver_id, departure_time, arrival_time, status, passenger_count, capacity, branch_id, company_id')
      .eq('company_id', window.companyId)
      .order('departure_time', { ascending: true });
    setTrips(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); const sub = subscribeToTrips(load); return () => { try { sub.unsubscribe?.(); } catch {} } }, []);

  const filtered = trips.filter(t => (
    ((routeSearch || '').trim() === '' ? true : (t.route_name || '').toLowerCase().includes(routeSearch.toLowerCase())) &&
    ((statusFilter || '').trim() === '' ? true : (t.status || '').toLowerCase().includes(statusFilter.toLowerCase()))
  ));

  const notify = async (title, body) => {
    try { await Promise.all([createAnnouncement(title, body), sendMessage(body)]); } catch {}
  };

  const reassign = async (row) => {
    const newBus = prompt('New Bus ID', row.bus_id || '');
    const newDriver = prompt('New Driver ID', row.driver_id || '');
    await upsertTripSchedule(row.trip_id, { bus_id: newBus || row.bus_id, driver_id: newDriver || row.driver_id });
    await notify('Trip Reassignment', `Trip ${row.trip_id} (${row.route_name||'Route'}) was reassigned. Bus: ${newBus||row.bus_id||'-'}, Driver: ${newDriver||row.driver_id||'-'}.`);
    load();
  };
  const setDelayed = async (row) => {
    await updateTripStatus(row.trip_id, 'Delayed');
    await notify('Trip Delayed', `Trip ${row.trip_id} (${row.route_name||'Route'}) is delayed. Departure: ${new Date(row.departure_time).toLocaleTimeString()}.`);
    load();
  };
  const cancelTrip = async (row) => {
    await updateTripStatus(row.trip_id, 'Cancelled');
    await notify('Trip Cancelled', `Trip ${row.trip_id} (${row.route_name||'Route'}) is cancelled. Affected passengers will be notified.`);
    load();
  };
  const logIncident = async (row) => {
    const type = prompt('Incident type (accident/closure/dispute/other):', 'other');
    const details = prompt('Details:', '');
    await createIncident({ trip_id: row.trip_id, route_id: row.route_id, type, details });
    await notify('Incident Logged', `Incident on trip ${row.trip_id} (${row.route_name||'Route'}): ${type}. ${details}`);
    alert('Incident logged');
  };
  const optimizeRoute = async (row) => {
    alert('Optimization queued for route ' + (row.route_name || row.route_id));
  };

  const actions = [
    { label: 'Reassign', icon: 'swap', onClick: ({ row }) => reassign(row) },
    { label: 'Delay', icon: 'schedule', onClick: ({ row }) => setDelayed(row) },
    { label: 'Cancel', icon: 'close', color: 'error', onClick: ({ row }) => cancelTrip(row) },
    { label: 'Log Incident', icon: 'report', onClick: ({ row }) => logIncident(row) },
    { label: 'Optimize', icon: 'rocket', onClick: ({ row }) => optimizeRoute(row) },
  ];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
          <Typography variant="h6" sx={{ flex: 1 }}>Active Trips</Typography>
          <TextField size="small" label="Search Route" value={routeSearch} onChange={e => setRouteSearch(e.target.value)} />
          <TextField size="small" label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        </Stack>
      </Paper>
      <DataTable
        data={filtered}
        loading={loading}
        columns={[
          { field: 'trip_id', headerName: 'Trip' },
          { field: 'route_name', headerName: 'Route' },
          { field: 'departure_time', headerName: 'Departure', type: 'date' },
          { field: 'arrival_time', headerName: 'Arrival', type: 'date' },
          { field: 'status', headerName: 'Status', type: 'status' },
          { field: 'passenger_count', headerName: 'Passengers' },
          { field: 'capacity', headerName: 'Capacity' },
        ]}
        rowActions={actions.map(a => ({ ...a, onClick: (row) => a.onClick({ row }) }))}
        searchable
        pagination
      />
    </Box>
  );
}


