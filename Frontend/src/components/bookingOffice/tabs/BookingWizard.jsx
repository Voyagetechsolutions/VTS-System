import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, TextField, Select, MenuItem, Typography } from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function BookingWizard({ open, onClose, initialTripId, initialStep = 1, initialSeats = [] }) {
  const [step, setStep] = useState(1);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [tripSeats, setTripSeats] = useState({ capacity: 0, taken: new Set(), blocked: new Set() });
  const [selection, setSelection] = useState({ pickup: '', dropoff: '', route_id: '', trip_id: '', departure_time: '', arrival_time: '' });
  const [groupSize, setGroupSize] = useState(1);
  const [passengers, setPassengers] = useState([{ first_name: '', last_name: '', id_number: '', phone: '', email: '', emergency: '', dob: '', nationality: '' }]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [price, setPrice] = useState(0);

  useEffect(() => { if (open) {
    setStep(initialStep || 1);
    setPassengers([{ first_name: '', last_name: '', id_number: '', phone: '', email: '', emergency: '', dob: '', nationality: '' }]);
    setGroupSize(Math.max(1, initialSeats?.length || 1));
    setSelectedSeats(initialSeats || []);
    if (initialTripId) {
      setSelection(s => ({ ...s, trip_id: initialTripId }));
    }
  } }, [open, initialTripId, initialStep, initialSeats]);

  useEffect(() => { (async () => { const { data } = await supabase.from('routes').select('route_id, origin, destination').eq('company_id', window.companyId); setRoutes(data || []); })(); }, []);

  const searchTrips = async () => {
    const routeMatches = (routes||[]).filter(r => (selection.pickup ? (r.origin||'').toLowerCase().includes(selection.pickup.toLowerCase()) : true) && (selection.dropoff ? (r.destination||'').toLowerCase().includes(selection.dropoff.toLowerCase()) : true)).map(r => r.route_id);
    if (!routeMatches.length) { setTrips([]); return; }
    const { data } = await supabase
      .from('trips_with_details')
      .select('trip_id, route_id, departure_time, arrival_time, capacity, passenger_count')
      .in('route_id', routeMatches)
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });
    setTrips(data || []);
  };

  const loadSeats = async () => {
    if (!selection.trip_id) return;
    const [{ data: booked }, { data: blocked }] = await Promise.all([
      supabase.from('bookings').select('seat_number').eq('trip_id', selection.trip_id),
      supabase.from('trip_seats').select('seat_number, blocked').eq('trip_id', selection.trip_id),
    ]);
    const capacity = (trips.find(t => t.trip_id === selection.trip_id)?.capacity) || 50;
    const takenSet = new Set((booked||[]).map(b => Number(b.seat_number)));
    const blockedSet = new Set((blocked||[]).filter(s => s.blocked).map(s => Number(s.seat_number)));
    setTripSeats({ capacity, taken: takenSet, blocked: blockedSet });
    setSelectedSeats([]);
  };

  useEffect(() => { if (selection.trip_id) loadSeats(); }, [selection.trip_id]);

  const seatGrid = useMemo(() => Array.from({ length: Math.max(0, tripSeats.capacity) }, (_, i) => i + 1), [tripSeats]);
  const toggleSeat = (n) => {
    if (tripSeats.taken.has(n) || tripSeats.blocked.has(n)) return;
    setSelectedSeats(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  const ensurePassengerList = (n) => {
    if (n < 1) n = 1; if (n > 10) n = 10;
    setGroupSize(n);
    setPassengers(prev => {
      const arr = [...prev];
      while (arr.length < n) arr.push({ first_name: '', last_name: '', id_number: '', phone: '', email: '', emergency: '', dob: '', nationality: '' });
      while (arr.length > n) arr.pop();
      return arr;
    });
  };

  const createBookings = async () => {
    // Ticket preview before payment is displayed in step 4; here we persist after payment step
    const trip_id = selection.trip_id;
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const seat = selectedSeats[i];
      await supabase.rpc('create_booking', {
        p_trip_id: trip_id,
        p_company_id: window.companyId,
        p_passenger_name: `${p.first_name} ${p.last_name}`.trim(),
        p_phone: p.phone || null,
        p_id_number: p.id_number || null,
        p_seat_number: Number(seat),
        p_payment_status: 'unpaid',
        p_source: 'desk'
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>New Booking</DialogTitle>
      <DialogContent>
        {step === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Search Trip</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField label="Pick-up Location" value={selection.pickup} onChange={e=>setSelection(s=>({ ...s, pickup: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} md={6}><TextField label="Drop-off Location" value={selection.dropoff} onChange={e=>setSelection(s=>({ ...s, dropoff: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12}><Button variant="contained" onClick={searchTrips}>Search</Button></Grid>
              <Grid item xs={12}>
                <Box sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                  {(trips||[]).map(t => (
                    <Box key={t.trip_id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: .5 }}>
                      <div>
                        <div>{new Date(t.departure_time).toLocaleString()} → {t.arrival_time ? new Date(t.arrival_time).toLocaleTimeString() : 'ETA N/A'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Seats: {(t.capacity||0) - (t.passenger_count||0)} available of {t.capacity||0}</div>
                      </div>
                      <Button size="small" variant={selection.trip_id===t.trip_id?'contained':'outlined'} onClick={() => setSelection(s => ({ ...s, route_id: t.route_id, trip_id: t.trip_id, departure_time: t.departure_time, arrival_time: t.arrival_time || null }))}>Select</Button>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
        {step === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Passenger Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><TextField type="number" label="# Passengers" value={groupSize} onChange={e=>ensurePassengerList(Number(e.target.value||1))} /></Grid>
            </Grid>
            <Box sx={{ mt: 1 }}>
              {passengers.map((p, idx) => (
                <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                  <Grid item xs={12} md={3}><TextField label={idx===0? 'First Name (Main)':'First Name'} value={p.first_name} onChange={e=>setPassengers(arr=>{ const c=[...arr]; c[idx] = { ...c[idx], first_name: e.target.value }; return c; })} fullWidth /></Grid>
                  <Grid item xs={12} md={3}><TextField label="Last Name" value={p.last_name} onChange={e=>setPassengers(arr=>{ const c=[...arr]; c[idx] = { ...c[idx], last_name: e.target.value }; return c; })} fullWidth /></Grid>
                  <Grid item xs={12} md={3}><TextField label="ID/Passport" value={p.id_number} onChange={e=>setPassengers(arr=>{ const c=[...arr]; c[idx] = { ...c[idx], id_number: e.target.value }; return c; })} fullWidth /></Grid>
                  {idx===0 && (
                    <>
                      <Grid item xs={12} md={3}><TextField label="Phone" value={p.phone} onChange={e=>setPassengers(arr=>{ const c=[...arr]; c[idx] = { ...c[idx], phone: e.target.value }; return c; })} fullWidth /></Grid>
                      <Grid item xs={12} md={3}><TextField label="Email (optional)" value={p.email} onChange={e=>setPassengers(arr=>{ const c=[...arr]; c[idx] = { ...c[idx], email: e.target.value }; return c; })} fullWidth /></Grid>
                      <Grid item xs={12} md={3}><TextField label="Emergency Contact" value={p.emergency} onChange={e=>setPassengers(arr=>{ const c=[...arr]; c[idx] = { ...c[idx], emergency: e.target.value }; return c; })} fullWidth /></Grid>
                      <Grid item xs={12} md={3}><TextField type="date" label="DOB" InputLabelProps={{ shrink: true }} value={p.dob} onChange={e=>setPassengers(arr=>{ const c=[...arr]; c[idx] = { ...c[idx], dob: e.target.value }; return c; })} fullWidth /></Grid>
                      <Grid item xs={12} md={3}><TextField label="Nationality" value={p.nationality} onChange={e=>setPassengers(arr=>{ const c=[...arr]; c[idx] = { ...c[idx], nationality: e.target.value }; return c; })} fullWidth /></Grid>
                    </>
                  )}
                </Grid>
              ))}
            </Box>
          </Box>
        )}
        {step === 3 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Seat Allocation</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: .5, maxWidth: 260 }}>
              {seatGrid.map(n => {
                const isTaken = tripSeats.taken.has(n);
                const isBlocked = tripSeats.blocked.has(n);
                const selected = selectedSeats.includes(n);
                const color = isBlocked ? 'warning' : (isTaken ? 'inherit' : 'primary');
                return (
                  <Button key={n} size="small" variant={selected ? 'contained':'outlined'} color={color} disabled={isTaken || isBlocked} onClick={() => toggleSeat(n)}>{n}</Button>
                );
              })}
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Legend: grey=booked, yellow=reserved, blue=available</Typography>
          </Box>
        )}
        {step === 4 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Confirm Details & Ticket</Typography>
            <div>Trip: {selection.trip_id} • {selection.departure_time ? new Date(selection.departure_time).toLocaleString(): ''}</div>
            <div>Passengers: {passengers.map(p => `${p.first_name} ${p.last_name}`.trim()).join(', ')}</div>
            <div>Seats: {(selectedSeats||[]).join(', ') || '-'}</div>
            <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: 1, p: 1, mt: 1 }}>
              <Typography variant="subtitle2">Ticket Preview</Typography>
              <Typography variant="caption">Present this at boarding. Official receipt handled at counter.</Typography>
            </Box>
          </Box>
        )}
        {step === 5 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Payment</Typography>
            <Select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
            </Select>
            <Typography variant="body2" sx={{ mt: 1 }}>Payment is processed at the office. System will record booking as unpaid until reconciled.</Typography>
          </Box>
        )}
        {step === 6 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Print / Email Ticket</Typography>
            <Button size="small" variant="contained" onClick={()=>window.print()}>Print Ticket</Button>
            <Button size="small" sx={{ ml: 1 }} onClick={() => { const email = passengers[0]?.email || ''; const e = prompt('Send ticket to email:', email); if (e) alert('Ticket email queued to '+e); }}>Email Ticket</Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {step > 1 && <Button onClick={()=>setStep(step-1)}>Back</Button>}
        {step === 1 && <Button variant="contained" disabled={!selection.trip_id} onClick={()=>setStep(2)}>Next</Button>}
        {step === 2 && <Button variant="contained" onClick={()=>setStep(3)} disabled={passengers.length<1 || !passengers[0].first_name || !passengers[0].last_name || !passengers[0].id_number}>Next</Button>}
        {step === 3 && <Button variant="contained" onClick={()=>setStep(4)} disabled={selectedSeats.length !== passengers.length}>Next</Button>}
        {step === 4 && <Button variant="contained" onClick={()=>setStep(5)}>Next</Button>}
        {step === 5 && <Button variant="contained" onClick={async ()=>{ await createBookings(); setStep(6); }}>Finish</Button>}
      </DialogActions>
    </Dialog>
  );
}


