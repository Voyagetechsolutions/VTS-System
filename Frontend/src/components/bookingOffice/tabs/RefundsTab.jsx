import React, { useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert } from '@mui/material';
import { searchBookings, cancelBooking } from '../../../supabase/api';

export default function RefundsTab() {
  const [q, setQ] = useState('');
  const [reason, setReason] = useState('');
  const [found, setFound] = useState([]);
  const [msg, setMsg] = useState(null);

  const search = async () => {
    const r = await searchBookings(q);
    setFound(r.data || []);
  };

  const cancel = async (id) => {
    setMsg(null);
    const r = await cancelBooking(id, reason || 'Customer request');
    if (r.error) setMsg(r.error.message);
    else setMsg('Booking cancelled');
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Refunds & Cancellations</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Find booking (name)" value={q} onChange={e => setQ(e.target.value)} />
          <TextField label="Reason" value={reason} onChange={e => setReason(e.target.value)} />
          <Button variant="contained" onClick={search}>Search</Button>
        </Stack>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {(found || []).map(b => (
            <Stack key={b.booking_id} direction="row" spacing={2} alignItems="center">
              <Typography>{b.passenger_name}</Typography>
              <Typography variant="body2">Seat {b.seat_number}</Typography>
              <Button size="small" color="error" onClick={() => cancel(b.booking_id)}>Cancel / Refund</Button>
            </Stack>
          ))}
        </Stack>
        {msg && <Alert sx={{ mt: 2 }} severity={msg === 'Booking cancelled' ? 'success' : 'error'}>{msg}</Alert>}
      </Paper>
    </Box>
  );
}


