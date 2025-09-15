import React, { useEffect, useState } from 'react';
import { subscribeToTrips } from '../../supabase/realtime';
import { Paper, Typography } from '@mui/material';

export default function RealtimeTrips() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const subscription = subscribeToTrips(payload => {
      setEvents(e => [...e, payload]);
    });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6">Realtime Trip Events</Typography>
      {events.map((ev, idx) => (
        <Typography key={idx} variant="body2">{JSON.stringify(ev)}</Typography>
      ))}
    </Paper>
  );
}
