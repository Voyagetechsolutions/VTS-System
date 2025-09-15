import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { getDriverTripHistory } from '../../../supabase/api';

export default function HistoryTab() {
  const [data, setData] = useState([]);
  useEffect(() => { getDriverTripHistory().then(res => setData(res.data || [])); }, []);
  return (
    <Box>
      {data.map(h => (
        <Paper key={h.id} sx={{ p: 2, mb: 1 }}>
          <Typography>{h.date} • {h.route} • {h.status}</Typography>
          <Typography variant="body2" color="text.secondary">Seats: {h.seats} • Feedback: {h.feedback}</Typography>
        </Paper>
      ))}
    </Box>
  );
}


