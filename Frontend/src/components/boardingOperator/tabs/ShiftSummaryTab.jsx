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

  const load = async () => {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const [{ data: bks }, { data: trips }] = await Promise.all([
      supabase.from('bookings').select('booking_id, trip_id, status').eq('company_id', companyId).gte('booking_date', start.toISOString()).lte('booking_date', end.toISOString()),
      supabase.from('trips_with_details').select('trip_id, bus_id, route_name, passenger_count, capacity, departure_time').eq('company_id', companyId).gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString()),
    ]);
    const boarded = (bks||[]).filter(b => String(b.status||'').toLowerCase() === 'checked-in').length;
    const expected = (bks||[]).length;
    setSummary({ boarded, noShows: Math.max(0, expected - boarded), departures: (trips||[]).length });
    const manifestRows = (trips||[]).map(t => {
      const pct = t.capacity ? Math.round(((t.passenger_count||0)/t.capacity)*100) : 0;
      let level = 'green';
      if (pct < 40) level = 'red'; else if (pct < 80) level = 'yellow';
      return { trip: t.trip_id, bus: t.bus_id, passengers: Number(t.passenger_count||0), occupancy_pct: pct, level };
    });
    setManifest(manifestRows);
  };
  useEffect(() => { load(); }, [companyId]);

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
