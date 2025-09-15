import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { getIncidents } from '../../supabase/api';
import { subscribeToIncidents } from '../../supabase/realtime';

export default function ComplianceSafetyTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => { getIncidents().then(r => setRows(r.data || [])); }, []);
  useEffect(() => {
    const sub = subscribeToIncidents(() => getIncidents().then(r => setRows(r.data || [])));
    return () => { try { sub.unsubscribe?.(); } catch {} };
  }, []);
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Compliance & Safety Logs</Typography>
      <Paper>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reported</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows || []).map(r => (
              <TableRow key={r.incident_id}>
                <TableCell>{r.incident_id}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{new Date(r.reported_at || r.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}


