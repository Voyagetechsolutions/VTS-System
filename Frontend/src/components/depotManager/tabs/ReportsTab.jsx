import React, { useEffect, useState } from 'react';
import { Box, Button, Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
}

export default function ReportsTab() {
  const [ops, setOps] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [inv, setInv] = useState([]);
  const [staff, setStaff] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => { (async () => {
    const start = new Date(); start.setHours(0,0,0,0); const end = new Date(); end.setHours(23,59,59,999);
    const [{ data: t }, { data: m }, { data: i }, { data: s }] = await Promise.all([
      supabase.from('trips_with_details').select('trip_id, route_name, status, departure_time, arrival_time').eq('company_id', companyId).gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString()),
      supabase.from('repair_logs').select('bus_id, duration_hours, created_at').eq('company_id', companyId),
      supabase.from('inventory_usage').select('item, quantity, used_at').eq('company_id', companyId),
      supabase.from('staff_tasks').select('staff_name, role, status').eq('company_id', companyId),
    ]);
    setOps(t||[]); setFleet(m||[]); setInv(i||[]); setStaff(s||[]);
  })(); }, [companyId]);

  const exportAll = () => {
    const zip = [
      ['ops.csv', toCSV(ops)],
      ['fleet.csv', toCSV(fleet)],
      ['inventory.csv', toCSV(inv)],
      ['staff.csv', toCSV(staff)],
    ];
    const blob = new Blob(zip.map(([name, data]) => `=== ${name} ===\n${data}\n\n`), { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'depot_reports.txt'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Button variant="contained" onClick={exportAll}>Export Reports</Button>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}><DashboardCard title="Operations"><DataTable data={ops} columns={[{ field: 'trip_id', headerName: 'Trip' }, { field: 'route_name', headerName: 'Route' }, { field: 'status', headerName: 'Status' }, { field: 'departure_time', headerName: 'Departure', type: 'date' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Fleet"><DataTable data={fleet} columns={[{ field: 'bus_id', headerName: 'Bus' }, { field: 'duration_hours', headerName: 'Down Hours' }, { field: 'created_at', headerName: 'Date', type: 'date' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Inventory"><DataTable data={inv} columns={[{ field: 'item', headerName: 'Item' }, { field: 'quantity', headerName: 'Qty' }, { field: 'used_at', headerName: 'Used', type: 'date' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Staff"><DataTable data={staff} columns={[{ field: 'staff_name', headerName: 'Staff' }, { field: 'role', headerName: 'Role' }, { field: 'status', headerName: 'Status' }]} searchable pagination /></DashboardCard></Grid>
      </Grid>
    </Box>
  );
}
