import React, { useEffect, useState } from 'react';
import { Paper, Typography, Button } from '@mui/material';
import { getRealtimeTripStatus, sendAlert } from '../../../supabase/api';

export default function RealtimeTab() {
  const [status, setStatus] = useState([]);
  useEffect(() => {
    getRealtimeTripStatus().then(({ data }) => setStatus(data || []));
  }, []);
  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6">Real-Time Trip Status</Typography>
      {status.map((s, idx) => (
        <Typography key={idx} variant="body2">{JSON.stringify(s)}</Typography>
      ))}
      <Button variant="contained" color="error" sx={{ mt: 2 }} onClick={sendAlert}>Send Alert</Button>
    </Paper>
  );
}
