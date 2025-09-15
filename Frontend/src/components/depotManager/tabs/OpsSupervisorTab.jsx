import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function OpsSupervisorTab() {
  const [trips, setTrips] = useState([]);
  const [staff, setStaff] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    (async () => {
      const start = new Date(); start.setHours(0,0,0,0); const end = new Date(); end.setHours(23,59,59,999);
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from('trips_with_details').select('trip_id, route_name, departure_time, arrival_time, status').eq('company_id', companyId).gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString()),
        supabase.from('staff_tasks').select('staff_name, role, status').eq('company_id', companyId).gte('created_at', start.toISOString()),
      ]);
      setTrips(t||[]); setStaff(s||[]);
    })();
  }, [companyId]);

  const renderTimeline = () => (
    <Box sx={{ display: 'grid', gap: 1 }}>
      {(trips||[]).map(t => {
        const start = new Date(t.departure_time); const end = new Date(t.arrival_time);
        const durationMins = Math.max(1, Math.round((end.getTime()-start.getTime())/60000));
        const width = Math.min(100, Math.max(5, durationMins/10));
        return (
          <Box key={t.trip_id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 160 }}>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
            <Box sx={{ flex: 1, background: '#eef2f7', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ width: `${width}%`, background: (t.status||'').toLowerCase()==='delayed' ? 'linear-gradient(90deg,#ff9800,#f44336)' : 'linear-gradient(90deg,#2196f3,#64b5f6)', color: '#fff', px: 1 }}>
                <Typography variant="caption">{t.route_name} · {t.status}</Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
      {(!trips || trips.length===0) && <Typography variant="body2">No trips today</Typography>}
    </Box>
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Daily Trip Timelines" variant="outlined">
          {renderTimeline()}
        </DashboardCard>
      </Grid>
      {/* Incidents removed as requested */}
      <Grid item xs={12}>
        <DashboardCard title="Staff Coordination" variant="outlined">
          <DataTable
            data={staff}
            columns={[
              { field: 'staff_name', headerName: 'Staff' },
              { field: 'role', headerName: 'Role' },
              { field: 'status', headerName: 'Status' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
