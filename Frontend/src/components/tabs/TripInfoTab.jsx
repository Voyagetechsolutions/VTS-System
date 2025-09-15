import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody, Stack, Select, MenuItem } from '@mui/material';
import { supabase } from '../../supabase/client';

export default function TripInfoTab({ scope = 'driver' }) {
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      const uid = window.userId;
      let q = supabase
        .from('trips_with_details')
        .select('trip_id, date, departure_time, arrival_time, status, bus:bus_id (license_plate), route:route_id (origin, destination), passengers:trip_id(count)')
        .eq('company_id', window.companyId)
        .order('date', { ascending: true })
        .limit(200);
      if (scope === 'driver' && uid) q = q.eq('driver_id', uid);
      if (scope === 'ops_manager') {
        const bid = window.userBranchId || null;
        if (bid != null) q = q.eq('branch_id', bid);
      }
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (!error) setTrips(data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [status]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Trip Information</Typography>
        <Select size="small" value={status} onChange={e => setStatus(e.target.value)} displayEmpty>
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="scheduled">Scheduled</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </Select>
      </Stack>
      <Paper>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Departure</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Bus</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Passengers</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(trips || []).map(t => (
              <TableRow key={t.trip_id}>
                <TableCell>{t.date}</TableCell>
                <TableCell>{t.departure_time}</TableCell>
                <TableCell>{t.route?.origin} → {t.route?.destination}</TableCell>
                <TableCell>{t.bus?.license_plate || '-'}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>{Array.isArray(t.passengers) ? (t.passengers[0]?.count || 0) : (t.passengers || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}


