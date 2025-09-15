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
  const [tasks, setTasks] = useState([]);
  const [downtime, setDowntime] = useState([]);
  const [inv, setInv] = useState([]);
  const [carbon, setCarbon] = useState([]);
  const [recycle, setRecycle] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => { (async () => {
    const [{ data: t }, { data: d }, { data: i }, { data: c }, { data: r }] = await Promise.all([
      supabase.from('maintenance_tasks').select('id, bus_id, title, status, staff_id, created_at').eq('company_id', companyId),
      supabase.from('repair_logs').select('bus_id, duration_hours, created_at').eq('company_id', companyId),
      supabase.from('inventory_usage').select('item, quantity, used_at').eq('company_id', companyId),
      supabase.from('maintenance_carbon').select('bus_id, scope, amount_kg, logged_at').eq('company_id', companyId),
      supabase.from('recycling_logs').select('item, quantity, unit, recycled_at').eq('company_id', companyId),
    ]);
    setTasks(t||[]); setDowntime(d||[]); setInv(i||[]); setCarbon(c||[]); setRecycle(r||[]);
  })(); }, [companyId]);

  const exportAll = () => {
    const blob = new Blob([
      '=== tasks.csv ===\n' + toCSV(tasks) + '\n\n',
      '=== downtime.csv ===\n' + toCSV(downtime) + '\n\n',
      '=== inventory.csv ===\n' + toCSV(inv) + '\n\n',
    ], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'maintenance_reports.txt'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Button variant="contained" onClick={exportAll}>Export Reports</Button>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}><DashboardCard title="Tasks"><DataTable data={tasks} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'title', headerName: 'Task' }, { field: 'status', headerName: 'Status' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Downtime"><DataTable data={downtime} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'duration_hours', headerName: 'Hours' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Inventory Usage"><DataTable data={inv} columns={[{ field: 'used_at', headerName: 'Date', type: 'date' }, { field: 'item', headerName: 'Item' }, { field: 'quantity', headerName: 'Qty' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Carbon Log"><DataTable data={carbon} columns={[{ field: 'logged_at', headerName: 'Date', type: 'date' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'scope', headerName: 'Scope' }, { field: 'amount_kg', headerName: 'kg CO2e' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Recycling"><DataTable data={recycle} columns={[{ field: 'recycled_at', headerName: 'Date', type: 'date' }, { field: 'item', headerName: 'Item' }, { field: 'quantity', headerName: 'Qty' }, { field: 'unit', headerName: 'Unit' }]} searchable pagination /></DashboardCard></Grid>
      </Grid>
    </Box>
  );
}
