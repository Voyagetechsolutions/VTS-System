import React, { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
}

export default function ShiftSummaryTab() {
  const [summary, setSummary] = useState({ boarded: 0, noShows: 0, departures: 0 });
  const [manifest, setManifest] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId') || null;

  useEffect(() => {
    const loadData = async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      const [{ data: bks }, { data: trips }] = await Promise.all([
        supabase.from('bookings').select('*').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
        supabase.from('trips').select('*').gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString())
      ]);
      const boarded = (bks||[]).filter(b => b.status === 'boarded').length;
      const noShows = (bks||[]).filter(b => b.status === 'no_show').length;
      const departures = (trips||[]).length;
      setSummary({ boarded, noShows, departures });
      setManifest((bks||[]).map(b => ({ 
        trip: b.trip_id, 
        bus: b.bus_id, 
        passengers: 1, 
        occupancy_pct: 0, 
        level: b.status 
      })));
    };
    loadData();
  }, [companyId]);

  const exportCSV = () => {
    const csv = toCSV(manifest);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'shift_manifest.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <DashboardCard title="Shift KPIs" variant="outlined">
        <div>Boarded: {summary.boarded}</div>
        <div>No-shows: {summary.noShows}</div>
        <div>Departure buses: {summary.departures}</div>
      </DashboardCard>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Manifest (Today)" variant="outlined" action={<Button variant="outlined" onClick={exportCSV}>Export CSV</Button>}>
          <DataTable
            data={manifest}
            columns={[
              { field: 'trip', headerName: 'Trip' },
              { field: 'bus', headerName: 'Bus' },
              { field: 'passengers', headerName: 'Passengers' },
              { field: 'occupancy_pct', headerName: 'Occupancy %' },
              { field: 'level', headerName: 'Color' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Box>
    </Box>
  );
}
