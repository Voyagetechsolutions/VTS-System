import React, { useEffect, useState } from 'react';
import { Grid, TextField } from '@mui/material';
import DashboardCard, { StatsCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function CommandCenterTab() {
  const [kpis, setKpis] = useState({ expected: 0, boarded: 0, noShows: 0, departures: 0 });
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState('');
  const companyId = window.companyId || localStorage.getItem('companyId') || null;

  useEffect(() => { 
    const loadData = async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const startIso = today.toISOString();
      let boardedCount = 0;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_boarding_summary', { p_company_id: companyId });
        if (!rpcError && rpcData) boardedCount = rpcData.boarded || 0;
      } catch (error) {
        console.warn('Failed to get boarding summary:', error);
      }
      const { data: todaysTrips } = await supabase
        .from('trips_with_details')
        .select('trip_id, route_name, bus_id, departure_time, passenger_count, capacity, status')
        .eq('company_id', companyId)
        .gte('departure_time', startIso)
        .order('departure_time', { ascending: true });
      const expected = (todaysTrips||[]).reduce((s,t)=> s + Number(t.passenger_count||0), 0);
      const boarded = boardedCount;
      const noShows = Math.max(0, expected - boarded);
      setKpis({ expected, boarded, noShows, departures: (todaysTrips||[]).length });
      setTrips(todaysTrips || []);
    };
    loadData();
  }, [companyId]);

  const filteredTrips = (trips||[]).filter(t => (
    (search.trim() === '' ? true : ((t.route_name||'') + ' ' + (t.bus_id||'') + ' ' + (t.trip_id||'')).toLowerCase().includes(search.toLowerCase()))
  ));

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}><StatsCard title="Number of departures today" value={kpis.departures} icon="trips" color="info" /></Grid>
          <Grid item xs={12} sm={3}><StatsCard title="Expected Passengers today" value={kpis.expected} icon="passengers" color="primary" /></Grid>
          <Grid item xs={12} sm={3}><StatsCard title="Boarded" value={kpis.boarded} icon="check" color="success" /></Grid>
          <Grid item xs={12} sm={3}><StatsCard title="No-shows" value={kpis.noShows} icon="warning" color="warning" /></Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <DashboardCard title="Trip Status Board" variant="outlined" headerAction={<TextField size="small" placeholder="Search by route/bus/trip..." value={search} onChange={e => setSearch(e.target.value)} />}>
          <DataTable
            data={filteredTrips}
            columns={[
              { field: 'departure_time', headerName: 'Departure', type: 'date' },
              { field: 'route_name', headerName: 'Route' },
              { field: 'bus_id', headerName: 'Bus' },
              { field: 'passenger_count', headerName: 'Booked' },
              { field: 'capacity', headerName: 'Capacity' },
              { field: 'status', headerName: 'Status' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
      {/* Alerts removed as requested */}
    </Grid>
  );
}
