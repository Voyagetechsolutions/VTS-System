import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Chip, Divider, List, ListItem, ListItemText, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getActivityLog, getIncidents, getNotifications, getMessages } from '../../supabase/api';
import { subscribeToRoutes, subscribeToBuses, subscribeToIncidents, subscribeToMessages } from '../../supabase/realtime';

export default function NotificationsTab() {
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [messages, setMessages] = useState([]);

  const load = async () => {
    const [a, i, n, m] = await Promise.all([
      getActivityLog({ types: ['trip_status', 'incident_alert', 'speed_alert', 'maintenance_check'] }),
      getIncidents(),
      getNotifications?.() || { data: [] },
      getMessages(),
    ]);
    setAlerts(a.data || []);
    setIncidents(i.data || []);
    setMessages(m.data || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const subs = [
      subscribeToRoutes(load),
      subscribeToBuses(load),
      subscribeToIncidents(load),
      subscribeToMessages(load)
    ];
    return () => { subs.forEach(s => { try { s.unsubscribe?.(); } catch {} }); };
  }, []);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Notifications & Alerts</Typography>
        <IconButton onClick={load}><RefreshIcon /></IconButton>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1">Activity Alerts</Typography>
          <Divider sx={{ my: 1 }} />
          <List dense>
            {(alerts || []).map((a) => (
              <ListItem key={`${a.id}-${a.created_at}`}> 
                <ListItemText primary={a.type} secondary={a.message} />
                <Chip size="small" label={new Date(a.created_at).toLocaleString()} />
              </ListItem>
            ))}
          </List>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1">Open Incidents</Typography>
          <Divider sx={{ my: 1 }} />
          <List dense>
            {(incidents || []).map((i) => (
              <ListItem key={i.incident_id}>
                <ListItemText primary={i.description} secondary={i.status} />
              </ListItem>
            ))}
          </List>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1">Messages</Typography>
          <Divider sx={{ my: 1 }} />
          <List dense>
            {(messages || []).map((m, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={m.message} secondary={m.sender || m.created_at} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Stack>
    </Box>
  );
}