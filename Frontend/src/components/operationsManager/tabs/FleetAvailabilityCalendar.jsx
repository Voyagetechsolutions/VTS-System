import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Chip } from '@mui/material';
import { supabase } from '../../../supabase/client';

function daysAhead(n) {
  const d = new Date(); d.setDate(d.getDate() + n); d.setHours(0,0,0,0); return d;
}

export default function FleetAvailabilityCalendar() {
  const [buses, setBuses] = useState([]);
  const [busyMap, setBusyMap] = useState({});

  const load = async () => {
    const cid = window.companyId;
    const [{ data: busList }, { data: trips }, { data: maint }] = await Promise.all([
      supabase.from('buses').select('bus_id, license_plate').eq('company_id', cid),
      supabase.from('trips_with_details').select('bus_id, departure_time, arrival_time').eq('company_id', cid).gte('departure_time', daysAhead(0).toISOString()).lte('departure_time', daysAhead(7).toISOString()),
      supabase.from('maintenance_logs').select('bus_id, scheduled_at, status').eq('company_id', cid).gte('scheduled_at', daysAhead(0).toISOString()).lte('scheduled_at', daysAhead(7).toISOString()),
    ]);
    setBuses(busList || []);
    const map = {};
    (trips || []).forEach(t => {
      const day = new Date(t.departure_time).toDateString();
      map[t.bus_id] = map[t.bus_id] || {};
      map[t.bus_id][day] = 'Trip';
    });
    (maint || []).forEach(m => {
      const day = new Date(m.scheduled_at).toDateString();
      map[m.bus_id] = map[m.bus_id] || {};
      map[m.bus_id][day] = 'Maintenance';
    });
    setBusyMap(map);
  };

  useEffect(() => { load(); }, []);

  const days = Array.from({ length: 7 }).map((_, i) => daysAhead(i));

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Fleet Availability (Next 7 Days)</Typography>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={3}><Typography variant="subtitle2">Bus</Typography></Grid>
            {days.map((d, idx) => (
              <Grid item xs key={idx}><Typography variant="subtitle2" align="center">{d.toLocaleDateString([], { month: 'short', day: 'numeric' })}</Typography></Grid>
            ))}
          </Grid>
        </Grid>
        {(buses || []).map(b => (
          <Grid item xs={12} key={b.bus_id}>
            <Grid container alignItems="center">
              <Grid item xs={3}><Typography variant="body2">{b.license_plate}</Typography></Grid>
              {days.map((d, idx) => {
                const status = busyMap[b.bus_id]?.[d.toDateString()] || 'Available';
                const color = status === 'Trip' ? 'primary' : (status === 'Maintenance' ? 'warning' : 'success');
                return (
                  <Grid item xs key={idx}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Chip size="small" color={color} label={status} />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
