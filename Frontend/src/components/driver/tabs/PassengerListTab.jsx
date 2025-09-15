import React, { useEffect, useState } from 'react';
import { Box, TextField, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, Button, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
// Note: For full QR scanning, integrate html5-qrcode or similar; here we keep input-based fallback.
import { getDriverTrips, getDriverTripDetails, markPassengerLate, markPassengerNoShow, findBookingByCode, markBoarded, getCompanyContact } from '../../../supabase/api';
import { enqueue } from '../../../utils/offlineQueue';
// html5-qrcode: use minified build to avoid sourcemap warnings in dev

export default function PassengerListTab() {
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState('');
  const [manifest, setManifest] = useState([]);
  const [search, setSearch] = useState('');
  const [ticket, setTicket] = useState('');
  const [opsNumber, setOpsNumber] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => { getDriverTrips().then(({ data }) => setTrips(data || [])); getCompanyContact().then(res => setOpsNumber(res.data || '')); }, []);
  useEffect(() => {
    if (tripId) getDriverTripDetails(tripId).then(res => setManifest(res.data?.passengers || []));
  }, [tripId]);
  useEffect(() => {
    if (!qrOpen) return undefined;
    let scanner;
    let cancelled = false;
    let scriptEl;
    const init = () => {
      if (cancelled) return;
      const ScannerCtor = window.Html5QrcodeScanner;
      if (!ScannerCtor) return;
      scanner = new ScannerCtor('qr-reader', { fps: 10, qrbox: 220, rememberLastUsedCamera: true });
      scanner.render((decodedText) => { setTicket(decodedText); setQrOpen(false); setTimeout(scanTicket, 50); }, () => {});
    };
    if (!window.Html5QrcodeScanner) {
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.10/minified/html5-qrcode.min.js';
      scriptEl.async = true;
      scriptEl.onload = init;
      scriptEl.onerror = () => {};
      document.body.appendChild(scriptEl);
    } else {
      init();
    }
    return () => { cancelled = true; try { scanner?.clear(); } catch {} if (scriptEl) { try { scriptEl.onload = null; } catch {} } };
  }, [qrOpen]);

  const filtered = manifest.filter(p => (p.passenger_name||'').toLowerCase().includes(search.toLowerCase()) || String(p.booking_id||'').includes(search));

  const scanTicket = async () => {
    // Fallback: manual entry (native QR integration can fill ticket state)
    try {
      const res = await findBookingByCode(ticket);
      if (res?.data?.booking_id && (!tripId || res.data.trip_id === tripId)) {
        await markBoarded(res.data.booking_id);
        setManifest(m => m.map(x => x.booking_id === res.data.booking_id ? { ...x, boarding_status: 'Boarded' } : x));
        setTicket('');
      } else {
        alert('Ticket not found for this trip.');
      }
    } catch {
      enqueue({ type: 'ticket_scan', payload: { ticket_code: ticket, trip_id: tripId } });
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Select size="small" value={tripId} onChange={e => setTripId(e.target.value)} displayEmpty>
          <MenuItem value="">Select Trip...</MenuItem>
          {(trips||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.origin} → {t.destination} • {t.date} {t.departure_time}</MenuItem>)}
        </Select>
        <TextField size="small" label="Search by name or ticket" value={search} onChange={e => setSearch(e.target.value)} />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField size="small" label="Ticket QR/Code" value={ticket} onChange={e => setTicket(e.target.value)} inputMode="numeric" />
        <Button size="small" variant="contained" onClick={scanTicket}>Scan/Enter</Button>
        {opsNumber && <Button size="small" color="secondary" onClick={() => window.open(`tel:${opsNumber}`)}>Call Ops</Button>}
        <Button size="small" variant="outlined" onClick={() => setQrOpen(true)}>Open Camera</Button>
      </Stack>
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Scan Ticket</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Grant camera permission to scan QR codes.</Typography>
          <div id="qr-reader" style={{ width: '100%' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Seat</TableCell>
            <TableCell>Ticket Status</TableCell>
            <TableCell>Boarding</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(p => (
            <TableRow key={p.booking_id}>
              <TableCell>{p.passenger_name}</TableCell>
              <TableCell>{p.seat_number}</TableCell>
              <TableCell><Chip size="small" label={(p.payment_status || 'pending').toLowerCase()} color={(p.payment_status||'').toLowerCase()==='paid'?'success':'default'} /></TableCell>
              <TableCell><Chip size="small" label={(p.boarding_status || 'Not Boarded')} color={(p.boarding_status||'').toLowerCase()==='boarded'?'success':'default'} /></TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={async ()=>{ await markPassengerLate(p.booking_id); setManifest(m => m.map(x => x.booking_id===p.booking_id ? { ...x, boarding_status: 'Late Arrival' } : x)); }}>Mark Late</Button>
                  <Button size="small" color="warning" onClick={async ()=>{ await markPassengerNoShow(p.booking_id); setManifest(m => m.map(x => x.booking_id===p.booking_id ? { ...x, boarding_status: 'No Show' } : x)); }}>No Show</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}


