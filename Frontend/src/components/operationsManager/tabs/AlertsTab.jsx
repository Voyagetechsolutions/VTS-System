import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { getOpsAlerts, sendNotification } from '../../../supabase/api';

export default function AlertsTab() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    getOpsAlerts().then(({ data }) => setAlerts(data || []));
  }, []);
  return (
    <Box>
      <Typography variant="h5">Alerts & Notifications</Typography>
      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((a, idx) => (
              <TableRow key={idx}>
                <TableCell>{a.type}</TableCell>
                <TableCell>{a.message}</TableCell>
                <TableCell>{a.time}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => sendNotification(a)}>Notify</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
