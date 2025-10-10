import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody, Stack, Select, MenuItem, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { supabase } from '../../supabase/client';
import { getCompanySettings } from '../../supabase/api';

export default function TripInfoTab({ scope = 'driver' }) {
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('');
  const [routeId, setRouteId] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [canEdit, setCanEdit] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [reschedForm, setReschedForm] = useState({ date: '', departure_time: '' });

  const load = async () => {
    try {
      const uid = window.userId;
      let q = supabase
        .from('trips_with_details')
        .select('trip_id, date, departure_time, arrival_time, status, bus:bus_id (license_plate), route:route_id (origin, destination), passengers:trip_id(count)')
        .eq('company_id', window.companyId)
        .order('date', { ascending: true })
        .limit(200);
      if (scope === 'driver' && uid) q = q.eq('driver_id', uid);
      if (scope === 'ops_manager') {
        const bid = window.userBranchId || null;
        if (bid != null) q = q.eq('branch_id', bid);
      }
      if (status) q = q.eq('status', status);
      if (routeId) q = q.eq('route_id', routeId);
      if (dateStart) q = q.gte('date', dateStart);
      if (dateEnd) q = q.lte('date', dateEnd);
      const { data, error } = await q;
      if (!error) setTrips(data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [status, routeId, dateStart, dateEnd]);
  useEffect(() => { (async () => { try { const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole') || 'admin'; const { data } = await getCompanySettings(); setCanEdit(!!(data?.rbac?.[role]?.edit)); } catch { setCanEdit(true); } })(); }, []);

  const openDetails = (t) => { setSelectedTrip(t); setDetailsOpen(true); };
  const openReschedule = (t) => {
    setSelectedTrip(t);
    setReschedForm({
      date: t.date || new Date().toISOString().slice(0,10),
      departure_time: t.departure_time ? (t.departure_time.length > 16 ? t.departure_time.slice(0,16) : t.departure_time) : new Date().toISOString().slice(0,16)
    });
    setReschedOpen(true);
  };
  const saveReschedule = async () => {
    if (!selectedTrip?.trip_id) return;
    try {
      const payload = {
        date: reschedForm.date,
        departure_time: reschedForm.departure_time,
      };
      await supabase.from('trips').update(payload).eq('trip_id', selectedTrip.trip_id);
      setReschedOpen(false);
      setSelectedTrip(null);
      load();
    } catch {}
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Trip Information</Typography>
        <Select size="small" value={status} onChange={e => setStatus(e.target.value)} displayEmpty>
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="scheduled">Scheduled</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </Select>
        <TextField size="small" type="text" placeholder="Route ID" value={routeId} onChange={e => setRouteId(e.target.value)} />
        <TextField size="small" type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} InputLabelProps={{ shrink: true }} label="Start" />
        <TextField size="small" type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} InputLabelProps={{ shrink: true }} label="End" />
      </Stack>
      <Paper>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Departure</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Bus</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Passengers</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(trips || []).map(t => (
              <TableRow key={t.trip_id}>
                <TableCell>{t.date}</TableCell>
                <TableCell>{t.departure_time}</TableCell>
                <TableCell>{t.route?.origin} → {t.route?.destination}</TableCell>
                <TableCell>{t.bus?.license_plate || '-'}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>{Array.isArray(t.passengers) ? (t.passengers[0]?.count || 0) : (t.passengers || 0)}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => openDetails(t)}>Details</Button>
                  {canEdit && <Button size="small" variant="contained" sx={{ ml: 1 }} onClick={() => openReschedule(t)}>Reschedule</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trip Details</DialogTitle>
        <DialogContent>
          {selectedTrip ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">Trip ID: {selectedTrip.trip_id}</Typography>
              <Typography variant="body2">Date: {selectedTrip.date}</Typography>
              <Typography variant="body2">Departure: {selectedTrip.departure_time}</Typography>
              <Typography variant="body2">Arrival: {selectedTrip.arrival_time || '-'}</Typography>
              <Typography variant="body2">Route: {selectedTrip.route?.origin} → {selectedTrip.route?.destination}</Typography>
              <Typography variant="body2">Bus: {selectedTrip.bus?.license_plate || '-'}</Typography>
              <Typography variant="body2">Status: {selectedTrip.status}</Typography>
              <Typography variant="body2">Passengers: {Array.isArray(selectedTrip.passengers) ? (selectedTrip.passengers[0]?.count || 0) : (selectedTrip.passengers || 0)}</Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={reschedOpen} onClose={() => setReschedOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reschedule Trip</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Date" type="date" value={reschedForm.date} onChange={e => setReschedForm(f => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Departure" type="datetime-local" value={reschedForm.departure_time} onChange={e => setReschedForm(f => ({ ...f, departure_time: e.target.value }))} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReschedOpen(false)}>Cancel</Button>
          {canEdit && <Button variant="contained" onClick={saveReschedule}>Save</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}


