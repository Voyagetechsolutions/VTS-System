import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function NotificationsTab() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('type, message, created_at')
        .eq('company_id', window.companyId)
        .order('created_at', { ascending: false })
        .limit(100);
      setAlerts(data || []);
    })();
  }, []);
  return (
    <Box>
      <Typography variant="h5">Notifications & Alerts</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>Total: {alerts.length}</Typography>
      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(alerts||[]).map((a, idx) => (
              <TableRow key={idx}>
                <TableCell><Chip label={a.type} size="small" /></TableCell>
                <TableCell>{a.message}</TableCell>
                <TableCell>{new Date(a.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
