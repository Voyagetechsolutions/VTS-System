import React, { useEffect, useState } from 'react';
import { Grid, Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';
import { checkInBooking } from '../../../supabase/api';

export default function TripBoardingManagementTab() {
  const [tripId, setTripId] = useState('');
  const [tripsToday, setTripsToday] = useState([]);
  const [manifest, setManifest] = useState([]);
  const [seatMap, setSeatMap] = useState([]);
  const [searchPassenger, setSearchPassenger] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrText, setQrText] = useState('');
  const [cameraLoaded, setCameraLoaded] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId') || null;

  const load = async (id) => {
    if (!id) return;
    const [{ data: bookings }, { data: seats }] = await Promise.all([
      supabase.from('bookings').select('booking_id, ticket_number, passenger_name, id_number, seat_number, status, trip_id').eq('trip_id', id).eq('company_id', companyId),
      supabase.from('trip_seats').select('seat_number, occupied').eq('trip_id', id)
    ]);
    setManifest(bookings || []);
    setSeatMap(seats || []);
  };

  const loadTripsToday = async () => {
    const start = new Date(); start.setHours(0,0,0,0);
    const { data } = await supabase
      .from('trips_with_details')
      .select('trip_id, route_name, bus_id, departure_time, passenger_count, capacity, status')
      .eq('company_id', companyId)
      .gte('departure_time', start.toISOString())
      .order('departure_time', { ascending: true });
    setTripsToday(data || []);
  };

  const scanQR = async () => { setScannerOpen(true); };

  const manualCheckIn = async (bookingId) => {
    try { await checkInBooking(bookingId); load(tripId); } catch { alert('Failed'); }
  };

  useEffect(() => { loadTripsToday(); }, [companyId]);
  useEffect(() => { load(tripId); }, [tripId]);

  useEffect(() => {
    if (!scannerOpen) return;
    let cancelled = false;
    let scriptEl = null;
    let scanner = null;
    const startScanner = () => {
      try {
        if (!window.Html5QrcodeScanner) return;
        const el = document.getElementById('qr-reader');
        if (!el) return;
        const ScannerCtor = window.Html5QrcodeScanner;
        scanner = new ScannerCtor('qr-reader', { fps: 10, qrbox: 220, rememberLastUsedCamera: true });
        scanner.render(async (decodedText) => {
          try {
            if (!decodedText) return;
            setQrText(decodedText);
            await checkInBooking(decodedText);
            setScannerOpen(false);
            setQrText('');
            load(tripId);
          } catch { /* ignore and keep scanning */ }
        }, () => {});
      } catch {}
    };
    if (!window.Html5QrcodeScanner) {
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.10/minified/html5-qrcode.min.js';
      scriptEl.async = true;
      scriptEl.onload = () => { if (!cancelled) { setCameraLoaded(true); setTimeout(startScanner, 200); } };
      document.body.appendChild(scriptEl);
    } else {
      setCameraLoaded(true);
      setTimeout(startScanner, 200);
    }
    return () => { cancelled = true; try { scanner?.clear(); } catch {} if (scriptEl) { try { scriptEl.onload = null; } catch {} } };
  }, [scannerOpen]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField size="small" label="Search trips today" placeholder="Route/Bus" onChange={e=>{ const q=e.target.value.toLowerCase(); const t=(tripsToday||[]).find(x=>(`${x.route_name} ${x.bus_id}`).toLowerCase().includes(q)); if (t) setTripId(String(t.trip_id)); }} />
          <TextField size="small" label="Trip ID" value={tripId} onChange={e => setTripId(e.target.value)} />
          <Button variant="contained" onClick={() => load(tripId)}>Load</Button>
          <Button variant="outlined" onClick={scanQR}>Start Boarding (Scan)</Button>
        </Box>
      </Grid>
      <Grid item xs={12} md={7}>
        <DataTable
          data={(manifest||[]).filter(m => {
            const q = searchPassenger.trim().toLowerCase(); if (!q) return true;
            return (String(m.ticket_number||'').toLowerCase().includes(q) || String(m.passenger_name||'').toLowerCase().includes(q));
          })}
          columns={[
            { field: 'ticket_number', headerName: 'Ticket #' },
            { field: 'passenger_name', headerName: 'Passenger' },
            { field: 'id_number', headerName: 'ID/Passport' },
            { field: 'seat_number', headerName: 'Seat' },
            { field: 'status', headerName: 'Status' },
          ]}
          rowActions={[{ label: 'Check-in', icon: 'check', onClick: (row) => manualCheckIn(row.booking_id) }]}
          searchable
          pagination
        />
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search by ticket # or passenger" value={searchPassenger} onChange={e=>setSearchPassenger(e.target.value)} />
        </Box>
      </Grid>
      <Grid item xs={12} md={5}>
        <DataTable
          data={seatMap}
          columns={[
            { field: 'seat_number', headerName: 'Seat' },
            { field: 'occupied', headerName: 'Occupied' },
          ]}
          searchable
          pagination
        />
      </Grid>
      <Dialog open={scannerOpen} onClose={()=>setScannerOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Start Boarding - Scan Ticket</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Grant camera permission to scan tickets, or enter the ticket number manually.</Typography>
          <div id="qr-reader" style={{ width: '100%', display: cameraLoaded ? 'block' : 'none' }} />
          {!cameraLoaded && <Typography variant="caption" color="text.secondary">Loading camera…</Typography>}
          <TextField size="small" fullWidth sx={{ mt: 2 }} label="Ticket #" value={qrText} onChange={e=>setQrText(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setScannerOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!qrText){return;} try{ await checkInBooking(qrText); setQrText(''); setScannerOpen(false); load(tripId);}catch{ alert('Failed'); } }}>Check-in</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
