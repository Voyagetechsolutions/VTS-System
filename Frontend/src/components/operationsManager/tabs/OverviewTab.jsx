import React, { useEffect, useState } from 'react';
import { Grid, Typography, Button, Box, Stack } from '@mui/material';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import DirectionsBusFilledIcon from '@mui/icons-material/DirectionsBusFilled';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PercentIcon from '@mui/icons-material/Percent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { formatNumber } from '../../../utils/formatters';
import BarChart from '../../charts/BarChart';
import { getOpsManagerKPIs, assignBusToRoute, updateTripStatus, upsertTripSchedule, getCompanyAlertsFeed } from '../../../supabase/api';
import { subscribeToBookings, subscribeToBuses, subscribeToIncidents, subscribeToTrips } from '../../../supabase/realtime';
import { supabase } from '../../../supabase/client';
import CommandCenterMap from '../../companyAdmin/tabs/CommandCenterMap';
import FleetAvailabilityCalendar from './FleetAvailabilityCalendar';
import DashboardCard, { StatsCard, QuickActionCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';

// OverviewTab: Live map, KPIs, alerts, quick actions, charts, timeline, AI suggestions, fatigue alerts
export default function OverviewTab() {
  const [kpis, setKpis] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [timelineTrips, setTimelineTrips] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [fatigue, setFatigue] = useState([]);

  const loadKPIsAndAlerts = async () => {
    const [k, a] = await Promise.all([
      getOpsManagerKPIs().catch(()=>({ data: {} })),
      getCompanyAlertsFeed?.().catch(()=>({ data: [] }))
    ]);
    setKpis(k.data || {});
    setAlerts(a.data || []);
  };

  const loadTodayTrips = async () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const { data } = await supabase
      .from('trips_with_details')
      .select('trip_id, route_name, bus_id, driver_id, departure_time, arrival_time, status, passenger_count, capacity')
      .gte('departure_time', start.toISOString())
      .lte('departure_time', end.toISOString())
      .order('departure_time', { ascending: true });
    setTimelineTrips(data || []);
  };

  const computeSuggestions = () => {
    const s = [];
    try {
      const byRoute = {};
      (timelineTrips || []).forEach(t => {
        const key = t.route_name || 'Route';
        byRoute[key] = byRoute[key] || { count: 0, loads: [] };
        byRoute[key].count += 1;
        if (t.capacity && t.passenger_count != null) {
          byRoute[key].loads.push((t.passenger_count / Math.max(1, t.capacity)) * 100);
        }
      });
      Object.entries(byRoute).forEach(([route, info]) => {
        const avgLoad = info.loads.length ? (info.loads.reduce((a,b)=>a+b,0) / info.loads.length) : 0;
        if (avgLoad >= 85) {
          s.push(`Route ${route} is averaging ${Math.round(avgLoad)}% load. Consider adding a bus.`);
        }
      });
      if ((kpis.delaysToday || 0) > 5) s.push('High delays today. Consider rerouting or adjusting headways.');
      if ((kpis.incidentsToday || 0) > 0) s.push('Incidents detected. Ensure spare buses and relief drivers are available.');
    } catch {}
    setSuggestions(s);
  };

  const computeFatigue = async () => {
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
    const issues = [];
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
        issues.push({ driver_id: driver, total_minutes: totalMinutes, rest_issue: restIssue });
      }
    });
    setFatigue(issues);
  };

  useEffect(() => { computeSuggestions(); }, [timelineTrips, kpis]);

  useEffect(() => {
    loadKPIsAndAlerts();
    loadTodayTrips();
    computeFatigue();
    const subs = [
      subscribeToBookings(() => { loadKPIsAndAlerts(); computeFatigue(); }),
      subscribeToBuses(loadKPIsAndAlerts),
      subscribeToIncidents(() => { loadKPIsAndAlerts(); loadTodayTrips(); computeFatigue(); }),
      subscribeToTrips(() => { loadTodayTrips(); computeFatigue(); }),
    ];
    return () => {
      subs.forEach(s => { try { s.unsubscribe?.(); } catch {} });
    };
  }, []);

  const quickAssignDriver = async () => {
    const tripId = prompt('Trip ID to reassign driver');
    const driverId = prompt('New Driver ID');
    if (!tripId || !driverId) return;
    await upsertTripSchedule(tripId, { driver_id: driverId });
    await loadTodayTrips();
    alert('Driver reassigned');
  };
  const quickRerouteBus = async () => {
    const busId = prompt('Bus ID');
    const routeId = prompt('New Route ID');
    if (!busId || !routeId) return;
    await assignBusToRoute(busId, routeId);
    await loadKPIsAndAlerts();
    alert('Bus rerouted');
  };
  const quickDelayTrip = async () => {
    const tripId = prompt('Trip ID to delay');
    const minutes = Number(prompt('Delay minutes', '10')) || 0;
    if (!tripId || !minutes) return;
    await updateTripStatus(tripId, 'Delayed');
    await loadTodayTrips();
    alert('Trip marked delayed');
  };
  const quickCancelTrip = async () => {
    const tripId = prompt('Trip ID to cancel');
    if (!tripId) return;
    await updateTripStatus(tripId, 'Cancelled');
    await loadTodayTrips();
    alert('Trip cancelled');
  };

  const renderTimeline = () => (
    <DashboardCard title="Today\'s Trip Timeline" variant="outlined">
      <Box sx={{ display: 'grid', gap: 1 }}>
        {(timelineTrips || []).map(t => {
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
        {(!timelineTrips || timelineTrips.length === 0) && <Typography variant="body2">No trips today</Typography>}
      </Box>
    </DashboardCard>
  );

  const quickActions = [
    { label: 'Reassign Driver', icon: 'driver', onClick: quickAssignDriver },
    { label: 'Reroute Bus', icon: 'routes', onClick: quickRerouteBus },
    { label: 'Delay Trip', icon: 'schedule', onClick: quickDelayTrip },
    { label: 'Cancel Trip', icon: 'close', onClick: quickCancelTrip },
  ];

  return (
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
        <Grid item xs={12} md={8}>
          <DashboardCard title="Alerts & Activity" variant="outlined">
            <DataTable
              data={alerts}
              columns={[
                { field: 'created_at', headerName: 'Time', type: 'date' },
                { field: 'type', headerName: 'Type' },
                { field: 'message', headerName: 'Message' },
              ]}
              searchable
              pagination
            />
          </DashboardCard>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Button variant="contained" color="primary" onClick={quickAssignDriver}>Reassign Driver</Button>
          <Button variant="contained" color="primary" onClick={quickRerouteBus}>Reroute Bus</Button>
          <Button variant="contained" color="warning" onClick={quickDelayTrip}>Delay Trip</Button>
          <Button variant="contained" color="error" onClick={quickCancelTrip}>Cancel Trip</Button>
        </Stack>
      </Box>

      <Box mt={4}>{renderTimeline()}</Box>

      <Box mt={4}>
        <DashboardCard title="AI Suggestions" variant="outlined">
          {(suggestions || []).map((s, idx) => <Typography key={idx}>• {s}</Typography>)}
          {(!suggestions || suggestions.length === 0) && <Typography variant="body2">No suggestions at the moment</Typography>}
        </DashboardCard>
      </Box>

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
        <DashboardCard title="Occupancy Trends" variant="outlined">
          <BarChart data={kpis.occupancyTrends || []} xKey="month" yKey="occupancy" />
        </DashboardCard>
      </Box>
      <Box mt={4}>
        <DashboardCard title="Booking Trends" variant="outlined">
          <BarChart data={kpis.bookingTrends || []} xKey="month" yKey="bookings" />
        </DashboardCard>
      </Box>
      <Box mt={4}>
        <DashboardCard title="Route Performance" variant="outlined">
          <BarChart data={kpis.routePerformance || []} xKey="label" yKey="value" />
        </DashboardCard>
      </Box>
    </Box>
  );
}
