import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { updateTripStatusWithReason } from '../../../supabase/api';

export default function StatusTab() {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const setStatus = async (status) => {
    setBusy(true);
    try { await updateTripStatusWithReason(window.currentTripId || null, status, note); setNote(''); } finally { setBusy(false); }
  };
  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">Update Trip Status</Typography>
        <TextField label="Optional notes" value={note} onChange={e => setNote(e.target.value)} fullWidth sx={{ mt: 1, mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setStatus('Departed')} disabled={busy}>Departed</Button>
          <Button size="small" onClick={() => setStatus('En Route')} disabled={busy}>En Route</Button>
          <Button size="small" onClick={() => setStatus('Delayed')} disabled={busy}>Delayed</Button>
          <Button size="small" onClick={() => setStatus('Arrived')} disabled={busy}>Arrived</Button>
        </Stack>
      </Paper>
    </Box>
  );
}


