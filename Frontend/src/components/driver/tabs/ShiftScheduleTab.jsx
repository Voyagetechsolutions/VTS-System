import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listDriverShifts, getDriverTrips } from '../../../supabase/api';
import DriverWeekCalendar from './DriverWeekCalendar';

export default function ShiftScheduleTab() {
  const [rows, setRows] = useState([]);
  const [trips, setTrips] = useState([]);
  const userId = window.userId || localStorage.getItem('userId');
  useEffect(() => { (async () => { const r = await listDriverShifts(userId); setRows(r.data || []); const t = await getDriverTrips(userId); setTrips(t.data || []); })(); }, [userId]);
  return (
    <DashboardCard title="Shift & Schedule" variant="outlined">
      <Box sx={{ mb: 1, fontSize: 12, color: 'text.secondary' }}>Calendar view (Week)</Box>
      <DriverWeekCalendar driverId={userId} />
      <Box sx={{ mt: 2, mb: 1, fontSize: 12, color: 'text.secondary' }}>Upcoming assigned trips</Box>
      <DataTable
        data={rows}
        columns={[
          { field: 'start_time', headerName: 'Start', type: 'date' },
          { field: 'end_time', headerName: 'End', type: 'date' },
          { field: 'route_id', headerName: 'Route' },
          { field: 'status', headerName: 'Status' },
        ]}
        searchable
        pagination
      />
      <Box sx={{ mt: 2, mb: 1, fontSize: 12, color: 'text.secondary' }}>Upcoming assigned trips</Box>
      <DataTable
        data={trips}
        columns={[
          { field: 'date', headerName: 'Date' },
          { field: 'departure_time', headerName: 'Departure', type: 'date' },
          { field: 'origin', headerName: 'From' },
          { field: 'destination', headerName: 'To' },
          { field: 'status', headerName: 'Status' },
        ]}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
