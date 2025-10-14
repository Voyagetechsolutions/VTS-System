import React, { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Chip, Divider, List, ListItem, ListItemText, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getActivityLog, getIncidents, getNotifications, getMessages } from '../../supabase/api';
import { subscribeToRoutes, subscribeToBuses, subscribeToIncidents, subscribeToMessages } from '../../supabase/realtime';

export default function NotificationsTab() {
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [messages, setMessages] = useState([]);

  const fetchSnapshot = useCallback(async () => {
    const [activity, incidentRes, notificationRes, messageRes] = await Promise.all([
      getActivityLog({ types: ['trip_status', 'incident_alert', 'speed_alert', 'maintenance_check'] }),
      getIncidents(),
      getNotifications?.() || { data: [] },
      getMessages(),
    ]);
    return {
      activity: activity.data || [],
      incidents: incidentRes.data || [],
      messages: messageRes.data || [],
    };
  }, []);

  const applySnapshot = useCallback(async () => {
    const snapshot = await fetchSnapshot();
    setAlerts(snapshot.activity);
    setIncidents(snapshot.incidents);
    setMessages(snapshot.messages);
  }, [fetchSnapshot]);

  useEffect(() => {
    let active = true;
    const syncData = async () => {
      const snapshot = await fetchSnapshot();
      if (!active) return;
      setAlerts(snapshot.activity);
      setIncidents(snapshot.incidents);
      setMessages(snapshot.messages);
    };
    syncData();
    return () => {
      active = false;
    };
  }, [fetchSnapshot]);

  useEffect(() => {
    const subscriptions = [
      subscribeToRoutes(applySnapshot),
      subscribeToBuses(applySnapshot),
      subscribeToIncidents(applySnapshot),
      subscribeToMessages(applySnapshot)
    ];
    return () => {
      subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe?.();
        } catch (err) {
          console.error('Failed to unsubscribe notification listener', err);
        }
      });
    };
  }, [applySnapshot]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Notifications & Alerts</Typography>
        <IconButton onClick={() => { void applySnapshot(); }}><RefreshIcon /></IconButton>
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