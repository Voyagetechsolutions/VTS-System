import React, { useEffect, useState } from 'react';
import { Box, Grid, TextField, Button } from '@mui/material';
import DashboardCard, { StatsCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listDriverTripsInRange, computeDriverEarningsEstimate } from '../../../supabase/api';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
}

export default function EarningsTab() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7*24*3600*1000).toISOString().slice(0,10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10));
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ estimate: 0, completedTrips: 0 });

  const load = async () => {
    const range = { from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` };
    const [tripsRes, estRes] = await Promise.all([
      listDriverTripsInRange(range),
      computeDriverEarningsEstimate(range)
    ]);
    const trips = tripsRes.data || [];
    setRows(trips.map(t => ({
      date: t.departure_time,
      route: t.route_name,
      status: t.status,
      distance_km: t.distance_km || null,
      // Include special cases: covering leave/substitutions could have a flag or note
      allowance: String(t.status||'').toLowerCase()==='completed' ? 5 : 0
    })));
    setSummary({ estimate: estRes.data?.estimate || 0, completedTrips: estRes.data?.completedTrips || 0 });
  };

  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);

  const exportCSV = () => {
    const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'driver_earnings.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DashboardCard title="Earnings Overview" variant="outlined" headerAction={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} />
              <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} />
              <Button size="small" variant="contained" onClick={load}>Apply</Button>
              <Button size="small" variant="outlined" onClick={exportCSV}>Export CSV</Button>
            </Box>
          }>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}><StatsCard title="Completed Trips" value={summary.completedTrips} icon="trips" color="primary" /></Grid>
              <Grid item xs={12} sm={6} md={3}><StatsCard title="Estimated Earnings" value={`$${summary.estimate.toFixed(2)}`} icon="revenue" color="success" /></Grid>
            </Grid>
          </DashboardCard>
        </Grid>
        <Grid item xs={12}>
          <DashboardCard title="Trip Breakdown" variant="outlined">
            <DataTable
              data={rows}
              columns={[{ field: 'date', headerName: 'Date', type: 'date' }, { field: 'route', headerName: 'Route' }, { field: 'status', headerName: 'Status' }, { field: 'distance_km', headerName: 'Distance (km)' }, { field: 'allowance', headerName: 'Allowance ($)' }]}
              searchable
              pagination
            />
          </DashboardCard>
        </Grid>
      </Grid>
    </Box>
  );
}


