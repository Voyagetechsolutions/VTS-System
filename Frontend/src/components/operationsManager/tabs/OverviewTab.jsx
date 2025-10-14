import React, { useEffect, useState, useCallback } from 'react';
import { Grid, Typography, Button, Box, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, TextField, Checkbox, FormControlLabel } from '@mui/material';
import { formatNumber } from '../../../utils/formatters';
import BarChart from '../../charts/BarChart';
import { getCompanyKPIs, assignBusToRoute, updateTripStatus, upsertTripSchedule, getCompanyAlertsFeed, getCompanyRoutes, getCompanyBuses } from '../../../supabase/api';
import { subscribeToBookings, subscribeToBuses, subscribeToIncidents, subscribeToTrips } from '../../../supabase/realtime';
import { supabase } from '../../../supabase/client';
import CommandCenterMap from '../../companyAdmin/tabs/CommandCenterMap';
import FleetAvailabilityCalendar from './FleetAvailabilityCalendar';
import DashboardCard, { StatsCard, QuickActionCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';

// OverviewTab: Live map, KPIs, alerts, quick actions, charts, timeline, AI suggestions, fatigue alerts
export default function OverviewTab() {
  const [kpis, setKpis] = useState({});
  const [todayTrips, setTodayTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [dialogs, setDialogs] = useState({ reassign: false, reroute: false, delay: false, cancel: false });
  const [forms, setForms] = useState({ reassign: { trip_id: '', bus_id: '', route_id: '', current_driver_id: '', replace_driver_id: '', new_driver_id: '' }, reroute: { bus_id: '', route_id: '' }, delay: { trip_id: '', minutes: 10, inform: true }, cancel: { trip_id: '', inform: true } });
  const [busMap, setBusMap] = useState({});
  const [driverMap, setDriverMap] = useState({});
  const [fatigue, setFatigue] = useState([]);

  const loadKPIsAndAlerts = useCallback(async () => {
    const [k] = await Promise.all([
      getCompanyKPIs().catch(()=>({ data: {} })),
      getCompanyAlertsFeed?.().catch(()=>({ data: [] }))
    ]);
    setKpis(k.data || {});
  }, []);

  const loadTodayTrips = useCallback(async () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const { data } = await supabase
      .from('trips_with_details')
      .select('trip_id, route_name, bus_id, driver_id, departure_time, arrival_time, status, passenger_count, capacity')
      .gte('departure_time', start.toISOString())
      .lte('departure_time', end.toISOString())
      .order('departure_time', { ascending: true });
    const base = data || [];
    try {
      const [{ data: bs }, { data: ds }, { data: rs }] = await Promise.all([ getCompanyBuses(), supabase.from('users').select('user_id,name').eq('role','driver'), getCompanyRoutes() ]);
      const busLookup = Object.fromEntries((bs||[]).map(b => [b.bus_id, b.license_plate]));
      const driverLookup = Object.fromEntries((ds||[]).map(d => [d.user_id, d.name]));
      setBusMap(busLookup); setDriverMap(driverLookup);
      setBuses(bs||[]); setRoutes(rs||[]); setDrivers(ds||[]);
    } catch (error) { console.warn('KPIs load error:', error); }
    setTodayTrips(base);
  }, []);

  const computeFatigue = useCallback(async () => {
    // Heuristic: if a driver has more than 10 hours driving in last 24h or <8h rest between trips, flag
    const since = new Date(Date.now() - 24*3600*1000).toISOString();
    const { data } = await supabase
      .from('trips_with_details')
      .select('driver_id, departure_time, arrival_time')
      .gte('departure_time', since)
      .order('departure_time', { ascending: true });
    const byDriver = {};
    (data||[]).forEach(t => {
      byDriver[t.driver_id] = byDriver[t.driver_id] || [];
      byDriver[t.driver_id].push(t);
    });
    const fatigueList = [];
    Object.entries(byDriver).forEach(([driver, list]) => {
      let totalMinutes = 0;
      let restIssue = false;
      for (let i=0;i<list.length;i++) {
        const s = new Date(list[i].departure_time).getTime();
        const e = new Date(list[i].arrival_time).getTime();
        totalMinutes += Math.max(0, Math.round((e - s)/60000));
        if (i>0) {
          const prevEnd = new Date(list[i-1].arrival_time).getTime();
          const restHours = (s - prevEnd)/3600000;
          if (restHours < 8) restIssue = true;
        }
      }
      if (totalMinutes > 600 || restIssue) {
        fatigueList.push({ driver_id: driver, total_minutes: totalMinutes, rest_issue: restIssue });
      }
    });
    setFatigue(fatigueList);
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadKPIsAndAlerts(),
        loadTodayTrips(),
        computeFatigue()
      ]);
    };
    loadAllData();
    const subs = [
      subscribeToBookings(() => { loadKPIsAndAlerts(); computeFatigue(); }),
      subscribeToBuses(loadKPIsAndAlerts),
      subscribeToIncidents(() => { loadKPIsAndAlerts(); loadTodayTrips(); computeFatigue(); }),
      subscribeToTrips(() => { loadTodayTrips(); computeFatigue(); }),
    ];
    return () => {
      subs.forEach(sub => { try { sub.unsubscribe?.(); } catch (error) { console.warn('Subscription cleanup error:', error); } });
    };
  }, []);

  const openDialog = (key) => setDialogs(d => ({ ...d, [key]: true }));
  const closeDialog = (key) => setDialogs(d => ({ ...d, [key]: false }));
  const submitReassign = async () => {
    const f = forms.reassign;
    if (!f.trip_id || !f.new_driver_id) return;
    await upsertTripSchedule(f.trip_id, { driver_id: f.new_driver_id });
    setDialogs(d => ({ ...d, reassign: false }));
    await loadTodayTrips();
  };
  const submitReroute = async () => {
    const f = forms.reroute; if (!f.bus_id || !f.route_id) return;
    await assignBusToRoute(f.bus_id, f.route_id);
    setDialogs(d => ({ ...d, reroute: false }));
    await loadKPIsAndAlerts();
  };
  const submitDelay = async () => {
    const f = forms.delay; if (!f.trip_id) return;
    await updateTripStatus(f.trip_id, 'Delayed');
    if (f.inform) { try { await supabase.from('announcements').insert([{ company_id: window.companyId, title: 'Trip Delayed', message: `Trip ${f.trip_id} delayed by ${f.minutes} minutes.` }]); } catch {} }
    setDialogs(d => ({ ...d, delay: false }));
    await loadTodayTrips();
  };
  const submitCancel = async () => {
    const f = forms.cancel; if (!f.trip_id) return;
    await updateTripStatus(f.trip_id, 'Cancelled');
    if (f.inform) { try { await supabase.from('announcements').insert([{ company_id: window.companyId, title: 'Trip Cancelled', message: `Trip ${f.trip_id} has been cancelled.` }]); } catch {} }
    setDialogs(d => ({ ...d, cancel: false }));
    await loadTodayTrips();
  };

  const renderTimeline = () => (
    <DashboardCard title="Today\'s Trip Timeline" variant="outlined">
      <Box sx={{ display: 'grid', gap: 1 }}>
        {(todayTrips || []).map(t => {
          const start = new Date(t.departure_time);
          const end = new Date(t.arrival_time);
          const durationMins = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
          const width = Math.min(100, Math.max(5, durationMins / 10));
          const pct = t.capacity ? Math.round((t.passenger_count || 0) / t.capacity * 100) : 0;
          return (
            <Box key={t.trip_id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 160 }}>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
              <Box sx={{ flex: 1, background: '#eef2f7', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ width: `${width}%`, background: pct >= 85 ? 'linear-gradient(90deg,#ff9800,#f44336)' : 'linear-gradient(90deg,#2196f3,#64b5f6)', color: '#fff', px: 1 }}>
                  <Typography variant="caption">{t.route_name || 'Route'} · {t.status || '-'} · Load {pct}%</Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
        {(!todayTrips || todayTrips.length === 0) && <Typography variant="body2">No trips today</Typography>}
      </Box>
    </DashboardCard>
  );

  const quickActions = [
    { label: 'Reassign Driver', icon: 'driver', onClick: () => openDialog('reassign') },
    { label: 'Reroute Bus', icon: 'routes', onClick: () => openDialog('reroute') },
    { label: 'Delay Trip', icon: 'schedule', onClick: () => openDialog('delay') },
    { label: 'Cancel Trip', icon: 'close', onClick: () => openDialog('cancel') },
  ];

  return (
    <>
      <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DashboardCard title="Live Map" variant="elevated">
            <CommandCenterMap />
          </DashboardCard>
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}><StatsCard title="Trips Today" value={formatNumber(kpis.tripsToday || 0)} icon="trips" color="info" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatsCard title="Buses on Road" value={formatNumber(kpis.busesInOperation || 0)} icon="bus" color="primary" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatsCard title="On-time %" value={`${formatNumber(kpis.onTimePct || 0)}%`} icon="percent" color="success" /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatsCard title="Incidents Today" value={formatNumber(kpis.incidentsToday || 0)} icon="incident" color="warning" /></Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <QuickActionCard title="Quick Actions" actions={quickActions} />
        </Grid>
        {/* Removed Alerts & Activity per spec */}
      </Grid>

      {/* Removed extra buttons under quick actions per spec */}

      <Box mt={4}>
        <DashboardCard title="Today's Trips" variant="outlined">
          <DataTable
            data={(todayTrips||[]).map(t => ({
              trip_id: t.trip_id,
              route: t.route_name,
              bus: busMap[t.bus_id] || t.bus_id || '-',
              driver: driverMap[t.driver_id] || t.driver_id || '-',
              seats_booked: t.passenger_count || 0,
              departure: t.departure_time,
            }))}
            columns={[
              { field: 'trip_id', headerName: 'Trip' },
              { field: 'route', headerName: 'Route' },
              { field: 'bus', headerName: 'Bus' },
              { field: 'driver', headerName: 'Driver(s)' },
              { field: 'seats_booked', headerName: 'Seats Booked' },
              { field: 'departure', headerName: 'Departure', type: 'date' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Box>

      {/* AI suggestions removed per spec */}

      <Box mt={4}>
        <DashboardCard title="Fatigue Alerts" variant="outlined">
          {(fatigue || []).map((f, idx) => (
            <Typography key={idx} color="error">Driver {f.driver_id}: {Math.round(f.total_minutes/60)}h in last 24h{f.rest_issue ? ', insufficient rest' : ''}</Typography>
          ))}
          {(!fatigue || fatigue.length === 0) && <Typography variant="body2">No fatigue risks detected</Typography>}
        </DashboardCard>
      </Box>

      <Box mt={4}>
        <DashboardCard title="Fleet Availability (Next 7 Days)" variant="outlined">
          <FleetAvailabilityCalendar />
        </DashboardCard>
      </Box>

      <Box mt={4}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <DashboardCard title="Occupancy Trends" variant="outlined">
              <BarChart data={kpis.occupancyTrends || []} xKey="month" yKey="occupancy" />
            </DashboardCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <DashboardCard title="Booking Trends" variant="outlined">
              <BarChart data={kpis.bookingTrends || []} xKey="month" yKey="bookings" />
            </DashboardCard>
          </Grid>
        </Grid>
      </Box>
      <Box mt={4}>
        <DashboardCard title="Route Performance" variant="outlined">
          <BarChart data={kpis.routePerformance || []} xKey="label" yKey="value" />
        </DashboardCard>
      </Box>
    </Box>

      {/* Dialogs */}
    <Dialog open={dialogs.reassign} onClose={() => closeDialog('reassign')} maxWidth="sm" fullWidth>
      <DialogTitle>Reassign Driver</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Select displayEmpty value={forms.reassign.trip_id} onChange={e => setForms(f => ({ ...f, reassign: { ...f.reassign, trip_id: e.target.value } }))}>
            <MenuItem value="">Select Trip...</MenuItem>
            {(todayTrips||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.trip_id} · {t.route_name}</MenuItem>)}
          </Select>
          <Select displayEmpty value={forms.reassign.bus_id} onChange={e => setForms(f => ({ ...f, reassign: { ...f.reassign, bus_id: e.target.value } }))}>
            <MenuItem value="">Select Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
          </Select>
          <Select displayEmpty value={forms.reassign.route_id} onChange={e => setForms(f => ({ ...f, reassign: { ...f.reassign, route_id: e.target.value } }))}>
            <MenuItem value="">Select Route...</MenuItem>
            {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} → {r.destination}</MenuItem>)}
          </Select>
          <Select displayEmpty value={forms.reassign.replace_driver_id} onChange={e => setForms(f => ({ ...f, reassign: { ...f.reassign, replace_driver_id: e.target.value } }))}>
            <MenuItem value="">Pick driver to replace...</MenuItem>
            {(drivers||[]).map(d => <MenuItem key={d.user_id} value={d.user_id}>{d.name}</MenuItem>)}
          </Select>
          <Select displayEmpty value={forms.reassign.new_driver_id} onChange={e => setForms(f => ({ ...f, reassign: { ...f.reassign, new_driver_id: e.target.value } }))}>
            <MenuItem value="">New driver...</MenuItem>
            {(drivers||[]).map(d => <MenuItem key={d.user_id} value={d.user_id}>{d.name}</MenuItem>)}
          </Select>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => closeDialog('reassign')}>Cancel</Button>
        <Button variant="contained" onClick={submitReassign}>Save</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={dialogs.reroute} onClose={() => closeDialog('reroute')} maxWidth="sm" fullWidth>
      <DialogTitle>Reroute Bus</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Select displayEmpty value={forms.reroute.bus_id} onChange={e => setForms(f => ({ ...f, reroute: { ...f.reroute, bus_id: e.target.value } }))}>
            <MenuItem value="">Select Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
          </Select>
          <Select displayEmpty value={forms.reroute.route_id} onChange={e => setForms(f => ({ ...f, reroute: { ...f.reroute, route_id: e.target.value } }))}>
            <MenuItem value="">Select Route...</MenuItem>
            {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} → {r.destination}</MenuItem>)}
          </Select>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => closeDialog('reroute')}>Cancel</Button>
        <Button variant="contained" onClick={submitReroute}>Save</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={dialogs.delay} onClose={() => closeDialog('delay')} maxWidth="sm" fullWidth>
      <DialogTitle>Delay Trip</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Select displayEmpty value={forms.delay.trip_id} onChange={e => setForms(f => ({ ...f, delay: { ...f.delay, trip_id: e.target.value } }))}>
            <MenuItem value="">Select Trip...</MenuItem>
            {(todayTrips||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.trip_id} · {t.route_name}</MenuItem>)}
          </Select>
          <TextField type="number" label="Minutes" value={forms.delay.minutes} onChange={e => setForms(f => ({ ...f, delay: { ...f.delay, minutes: Number(e.target.value||0) } }))} />
          <FormControlLabel control={<Checkbox checked={!!forms.delay.inform} onChange={e => setForms(f => ({ ...f, delay: { ...f.delay, inform: e.target.checked } }))} />} label="Inform passengers" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => closeDialog('delay')}>Cancel</Button>
        <Button variant="contained" onClick={submitDelay}>Save</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={dialogs.cancel} onClose={() => closeDialog('cancel')} maxWidth="sm" fullWidth>
      <DialogTitle>Cancel Trip</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Select displayEmpty value={forms.cancel.trip_id} onChange={e => setForms(f => ({ ...f, cancel: { ...f.cancel, trip_id: e.target.value } }))}>
            <MenuItem value="">Select Trip...</MenuItem>
            {(todayTrips||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.trip_id} · {t.route_name}</MenuItem>)}
          </Select>
          <FormControlLabel control={<Checkbox checked={!!forms.cancel.inform} onChange={e => setForms(f => ({ ...f, cancel: { ...f.cancel, inform: e.target.checked } }))} />} label="Inform passengers" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => closeDialog('cancel')}>Cancel</Button>
        <Button variant="contained" onClick={submitCancel}>Save</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
