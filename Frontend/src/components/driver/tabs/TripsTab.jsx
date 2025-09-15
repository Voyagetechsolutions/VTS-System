import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography, Snackbar } from '@mui/material';
import { getDriverTrips, getTripOccupancy, getBoardingProgress, updateTripStatus, updateTripStatusWithReason, postGPSLocation, getRouteCoordinates, getRouteStops, startTrip, endTrip, raiseIncident, markCheckpointReached, submitPreTripInspection, logSpeedAlert, getCompanySpeedLimit, getBusesByIds } from '../../../supabase/api';
import { enqueue, flushQueue, startBackgroundSync, stopBackgroundSync } from '../../../utils/offlineQueue';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { subscribeToBookings, subscribeToTrips } from '../../../supabase/realtime';

export default function TripsTab() {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('today');
  const [delayDialog, setDelayDialog] = useState({ open: false, trip: null, reason: '' });
  const [inspectDialog, setInspectDialog] = useState({ open: false, trip: null, items: { brakes: false, lights: false, tires: false, fuel: false } });
  const [speedSnack, setSpeedSnack] = useState({ open: false, msg: '' });
  const speedLimitRef = useRef(100);

  const load = async () => {
    const res = await getDriverTrips();
    const list = res.data || [];
    // fetch occupancy, boarding and stops
    const withStats = await Promise.all(list.map(async t => {
      const [occ, board] = await Promise.all([
        getTripOccupancy(t.trip_id),
        getBoardingProgress(t.trip_id),
      ]);
      const stopsRes = await getRouteStops(t.route_id);
      return { ...t, occupancy: occ.data || { booked: 0, capacity: t.capacity || 0 }, boarding: board.data || { boarded: 0, total: t.capacity || 0 }, stops: stopsRes.data || [] };
    }));
    // resolve bus details
    const busIds = withStats.map(t => t.bus_id).filter(Boolean);
    const busesRes = await getBusesByIds(busIds);
    const busMap = new Map((busesRes.data||[]).map(b => [b.bus_id, b]));
    setTrips(withStats.map(t => ({ ...t, bus: busMap.get(t.bus_id) || null })));
  };

  useEffect(() => {
    load();
    const subBookings = subscribeToBookings(() => load());
    const subTrips = subscribeToTrips(() => load());
    const handlers = {
      start_trip: async ({ trip_id }) => startTrip(trip_id),
      end_trip: async ({ trip_id }) => endTrip(trip_id),
      checkpoint: async ({ trip_id, stop_index }) => markCheckpointReached(trip_id, stop_index),
      passenger_late: async ({ booking_id }) => {/* covered elsewhere */},
      passenger_no_show: async ({ booking_id }) => {/* covered elsewhere */},
      ticket_scan: async ({ ticket_code, trip_id }) => {/* handled in passenger tab */},
    };
    flushQueue(handlers);
    startBackgroundSync(handlers, 45000);
    getCompanySpeedLimit().then(res => { if (res && typeof res.data === 'number') speedLimitRef.current = res.data; }).catch(() => {});
    const locTimer = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude, speed } = pos.coords;
          postGPSLocation(latitude, longitude);
          // Speed in m/s; convert to km/h
          const kmh = typeof speed === 'number' && speed > 0 ? (speed * 3.6) : null;
          const limit = speedLimitRef.current || 100;
          if (kmh && kmh > limit) {
            setSpeedSnack({ open: true, msg: `Speed alert: ${Math.round(kmh)} km/h` });
            try { logSpeedAlert(Math.round(kmh), latitude, longitude); } catch {}
          }
        });
      }
    }, 5 * 60 * 1000);
    return () => { try { subBookings.unsubscribe(); } catch {} try { subTrips.unsubscribe(); } catch {} try { clearInterval(locTimer); } catch {} stopBackgroundSync(); };
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0,10);
    const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + 7);
    return (trips||[]).filter(t => {
      const d = new Date(t.date);
      if (filter === 'today') return t.date === todayStr;
      if (filter === 'week') return d >= now && d <= endOfWeek;
      if (filter === 'completed') return (t.status||'').toLowerCase() === 'arrived' || (t.status||'').toLowerCase() === 'completed';
      return true;
    });
  }, [trips, filter]);

  const doStatus = async (trip, status) => {
    if (status === 'Delayed') {
      setDelayDialog({ open: true, trip, reason: '' });
      return;
    }
    await updateTripStatus(trip.trip_id, status);
    await load();
  };

  return (
    <>
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <FormControl size="small">
          <InputLabel>Filter</InputLabel>
          <Select label="Filter" value={filter} onChange={e => setFilter(e.target.value)}>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Stack spacing={2}>
        {filtered.map(t => (
          <Paper key={t.trip_id} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1">{t.origin} → {t.destination}</Typography>
                <Typography variant="body2">{t.date} • Depart {t.departure_time} • Bus {t.bus?.license_plate || t.license_plate || t.bus_id || '-'} {t.bus?.model ? `• ${t.bus.model}` : ''} {t.bus?.capacity ? `• ${t.bus.capacity} seats` : ''}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>Occupancy: {(t.occupancy?.booked||0)}/{t.occupancy?.capacity||0} • Boarding: {(t.boarding?.boarded||0)}/{t.boarding?.total||0}</Typography>
              </Box>
              <Chip label={t.status || 'Scheduled'} size="small" />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Button size="small" onClick={() => doStatus(t, 'At Depot')}>At Depot</Button>
              <Button size="small" onClick={() => doStatus(t, 'Boarding Started')}>Boarding Started</Button>
              <Button size="small" variant="contained" onClick={() => setInspectDialog({ open: true, trip: t, items: { brakes: false, lights: false, tires: false, fuel: false } })}>Start Trip</Button>
              <Button size="small" color="success" variant="contained" onClick={async () => {
                try { await endTrip(t.trip_id); } catch { enqueue({ type: 'end_trip', payload: { trip_id: t.trip_id } }); }
              }}>End Trip</Button>
              <Button size="small" color="warning" variant="outlined" onClick={() => doStatus(t, 'Delayed')}>Delayed</Button>
              <Button size="small" color="primary" variant="text" onClick={async () => {
                const rc = await getRouteCoordinates(t.route_id);
                const { originCoords, destinationCoords } = rc.data || {};
                if (originCoords && destinationCoords) {
                  window.open(`https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${originCoords.lat},${originCoords.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}`, '_blank');
                } else {
                  window.open(`https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(t.destination)}`, '_blank');
                }
              }}>Navigate</Button>
              <Button size="small" color="primary" variant="text" onClick={async () => {
                const rc = await getRouteCoordinates(t.route_id);
                const { originCoords, destinationCoords } = rc.data || {};
                if (originCoords && destinationCoords) {
                  window.open(`https://waze.com/ul?ll=${destinationCoords.lat},${destinationCoords.lng}&navigate=yes`, '_blank');
                } else {
                  const q = encodeURIComponent(`${t.origin} to ${t.destination}`);
                  window.open(`https://waze.com/ul?q=${q}`, '_blank');
                }
              }}>Open Waze</Button>
              <Button size="small" color="secondary" variant="outlined" onClick={() => {
                const stops = (t.stops||[]).filter(s => s.role !== 'origin');
                const next = stops.find(s => !s.reached);
                if (next && next.lat && next.lng) {
                  window.open(`https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${next.lat},${next.lng}`, '_blank');
                } else if (next && next.name) {
                  window.open(`https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(next.name)}`, '_blank');
                } else {
                  window.open(`https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(t.destination)}`, '_blank');
                }
              }}>Navigate to Next Checkpoint</Button>
              <Button size="small" color="error" variant="outlined" onClick={() => raiseIncident('Accident')}>Accident</Button>
              <Button size="small" color="error" variant="outlined" onClick={() => raiseIncident('Mechanical Failure')}>Mechanical Failure</Button>
              <Button size="small" color="error" variant="outlined" onClick={() => raiseIncident('Security Issue')}>Security Issue</Button>
            </Stack>
            <Dialog open={delayDialog.open} onClose={()=>setDelayDialog({ open: false, trip: null, reason: '' })}>
              <DialogTitle>Delay Reason</DialogTitle>
              <DialogContent>
                <TextField label="Reason (traffic, breakdown, etc.)" fullWidth value={delayDialog.reason} onChange={e => setDelayDialog(d => ({ ...d, reason: e.target.value }))} />
              </DialogContent>
              <DialogActions>
                <Button onClick={()=>setDelayDialog({ open: false, trip: null, reason: '' })}>Cancel</Button>
                <Button variant="contained" color="warning" onClick={async ()=>{ if (delayDialog.trip) { await updateTripStatusWithReason(delayDialog.trip.trip_id, 'Delayed', delayDialog.reason); setDelayDialog({ open: false, trip: null, reason: '' }); await load(); } }}>Submit</Button>
              </DialogActions>
            </Dialog>
            {(t.stops && t.stops.length > 0) && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption">Checkpoints:</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                  {t.stops.map(s => (
                    <Chip
                      key={`${s.role}-${s.index}`}
                      label={`${s.name}${s.role==='origin'?' (Origin)':(s.role==='destination'?' (Destination)':'')}`}
                      size="small"
                      variant={s.reached ? 'filled' : 'outlined'}
                      color={s.role==='destination' && s.reached ? 'success' : (s.reached ? 'primary' : 'default')}
                      onClick={async () => {
                        try { await markCheckpointReached(t.trip_id, s.index); } catch { enqueue({ type: 'checkpoint', payload: { trip_id: t.trip_id, stop_index: s.index } }); }
                        // Optimistic UI: mark as reached
                        setTrips(prev => prev.map(tp => tp.trip_id === t.trip_id ? { ...tp, stops: (tp.stops||[]).map(st => st.index === s.index ? { ...st, reached: true } : st) } : tp));
                        // Auto-end if destination marked
                        if (s.role === 'destination') {
                          try { await endTrip(t.trip_id); } catch { enqueue({ type: 'end_trip', payload: { trip_id: t.trip_id } }); }
                          await load();
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Dialog open={inspectDialog.open} onClose={()=>setInspectDialog({ open: false, trip: null, items: { brakes: false, lights: false, tires: false, fuel: false } })}>
              <DialogTitle>Pre-Trip Inspection</DialogTitle>
              <DialogContent>
                {['brakes','lights','tires','fuel'].map(k => (
                  <FormControlLabel key={k} control={<Checkbox checked={!!inspectDialog.items[k]} onChange={e => setInspectDialog(d => ({ ...d, items: { ...d.items, [k]: e.target.checked } }))} />} label={k.charAt(0).toUpperCase()+k.slice(1)} />
                ))}
              </DialogContent>
              <DialogActions>
                <Button onClick={()=>setInspectDialog({ open: false, trip: null, items: { brakes: false, lights: false, tires: false, fuel: false } })}>Cancel</Button>
                <Button variant="contained" onClick={async ()=>{
                  const trip = inspectDialog.trip;
                  const passed = Object.values(inspectDialog.items).every(Boolean);
                  try { await submitPreTripInspection(trip.trip_id, inspectDialog.items, passed); } catch {}
                  try { await startTrip(trip.trip_id); } catch { enqueue({ type: 'start_trip', payload: { trip_id: trip.trip_id } }); }
                  setInspectDialog({ open: false, trip: null, items: { brakes: false, lights: false, tires: false, fuel: false } });
                }}>Submit & Start</Button>
              </DialogActions>
            </Dialog>
          </Paper>
        ))}
        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary">No trips for this filter.</Typography>
        )}
      </Stack>
    </Box>
    <Snackbar open={speedSnack.open} autoHideDuration={3000} onClose={() => setSpeedSnack({ open: false, msg: '' })} message={speedSnack.msg} />
    </>
  );
}


