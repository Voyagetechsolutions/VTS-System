import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Grid, Select, MenuItem } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';
import { upsertTripSchedule } from '../../../supabase/api';

export default function DispatchTab() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [passengers, setPassengers] = useState({});
  const [assign, setAssign] = useState({ trip_id: '', bus_id: '', driver_id: '' });
  const companyId = window.companyId || localStorage.getItem('companyId');

  const load = async () => {
    const [{ data: b }, { data: d }, { data: t }] = await Promise.all([
      supabase.from('buses').select('bus_id, license_plate, status, current_route, rank').eq('company_id', companyId),
      supabase.from('users').select('user_id, name, role, on_duty').eq('company_id', companyId).eq('role', 'driver').eq('on_duty', true),
      supabase.from('trips_with_details').select('trip_id, route_name, departure_time, status, bus_id, driver_id').eq('company_id', companyId).order('departure_time', { ascending: true }),
    ]);
    setBuses(b||[]); setDrivers(d||[]); setTrips(t||[]);
    try {
      const pax = {};
      for (const trip of (t||[])) {
        const { data: rows } = await supabase.from('bookings').select('booking_id').eq('trip_id', trip.trip_id).eq('status', 'Confirmed');
        pax[trip.trip_id] = (rows||[]).length;
      }
      setPassengers(pax);
    } catch {}
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [companyId]);

  const doAssign = async () => {
    if (!assign.trip_id) return;
    await upsertTripSchedule(assign.trip_id, { bus_id: assign.bus_id || null, driver_id: assign.driver_id || null });
    setAssign({ trip_id: '', bus_id: '', driver_id: '' });
    load();
  };

  const logDelay = async () => {
    const trip = window.prompt('Trip ID');
    const reason = window.prompt('Delay reason (mechanical, staff absence, passenger load, other)');
    if (!trip || !reason) return;
    await supabase.from('depot_delay_logs').insert([{ company_id: companyId, trip_id: trip, reason }]);
    alert('Delay reason logged');
  };

  return (
    <Box>
      <DashboardCard title="Trip Scheduling & Assignment" variant="outlined" action={<><Button variant="contained" onClick={doAssign} sx={{ mr: 1 }}>Assign</Button><Button variant="outlined" onClick={logDelay}>Log Delay</Button></>} headerAction={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Select size="small" value={assign.trip_id} onChange={e => setAssign(a => ({ ...a, trip_id: e.target.value }))} displayEmpty sx={{ minWidth: 180 }}>
            <MenuItem value="">Select Trip...</MenuItem>
            {(trips||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.trip_id} · {t.route_name} · {new Date(t.departure_time).toLocaleString()}</MenuItem>)}
          </Select>
          <Select size="small" value={assign.bus_id} onChange={e => setAssign(a => ({ ...a, bus_id: e.target.value }))} displayEmpty sx={{ minWidth: 140 }}>
            <MenuItem value="">Select Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
          </Select>
          <Select size="small" value={assign.driver_id} onChange={e => setAssign(a => ({ ...a, driver_id: e.target.value }))} displayEmpty sx={{ minWidth: 180 }}>
            <MenuItem value="">Select Driver (on duty)...</MenuItem>
            {(drivers||[]).map(d => <MenuItem key={d.user_id} value={d.user_id}>{d.name}</MenuItem>)}
          </Select>
        </Box>
      }>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <DashboardCard title="Buses" variant="outlined">
              <DataTable data={buses} columns={[{ field: 'bus_id', headerName: 'Bus' }, { field: 'license_plate', headerName: 'Plate' }, { field: 'status', headerName: 'Status' }, { field: 'current_route', headerName: 'Route' }, { field: 'rank', headerName: 'Rank' }]} searchable pagination />
            </DashboardCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <DashboardCard title="Drivers" variant="outlined">
              <DataTable data={drivers} columns={[{ field: 'user_id', headerName: 'Driver' }, { field: 'name', headerName: 'Name' }]} searchable pagination />
            </DashboardCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <DashboardCard title="Trips" variant="outlined">
              <DataTable data={trips.map(t => ({ ...t, passengers: passengers[t.trip_id] || 0 }))} columns={[{ field: 'trip_id', headerName: 'Trip' }, { field: 'route_name', headerName: 'Route' }, { field: 'departure_time', headerName: 'Departure', type: 'date' }, { field: 'status', headerName: 'Status' }, { field: 'passengers', headerName: 'Passengers' }]} searchable pagination />
            </DashboardCard>
          </Grid>
        </Grid>
      </DashboardCard>
    </Box>
  );
}
