import React, { useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert } from '@mui/material';
import { searchBookings, checkInBooking, getPassengerManifest } from '../../../supabase/api';

export default function CheckInTab() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState(null);

  const search = async () => {
    const r = await searchBookings(q);
    setResults(r.data || []);
  };

  const checkin = async (id) => {
    setMsg(null);
    const r = await checkInBooking(id);
    if (r.error) setMsg(r.error.message);
    else setMsg('Checked in');
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Passenger Check-in</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Search passenger" value={q} onChange={e => setQ(e.target.value)} />
          <Button variant="contained" onClick={search}>Search</Button>
        </Stack>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {(results || []).map(r => (
            <Stack key={r.booking_id} direction="row" spacing={2} alignItems="center">
              <Typography>{r.passenger_name}</Typography>
              <Typography variant="body2">Seat {r.seat_number}</Typography>
              <Typography variant="body2">{new Date(r.booking_date).toLocaleDateString()}</Typography>
              <Button size="small" onClick={() => checkin(r.booking_id)}>Check-in</Button>
            </Stack>
          ))}
        </Stack>
        {msg && <Alert sx={{ mt: 2 }} severity={msg === 'Checked in' ? 'success' : 'error'}>{msg}</Alert>}
      </Paper>
    </Box>
  );
}


