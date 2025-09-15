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
  const [rev, setRev] = useState([]);
  const [pnl, setPnL] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const start = new Date(); start.setMonth(start.getMonth()-1);
    const [{ data: payments }, { data: expenses }] = await Promise.all([
      supabase.from('payments').select('created_at, amount').eq('company_id', companyId).gte('created_at', start.toISOString()),
      supabase.from('expenses').select('created_at, amount').eq('company_id', companyId).gte('created_at', start.toISOString()),
    ]);
    setRev(payments||[]);
    const daily = (payments||[]).map(p => ({ date: p.created_at, revenue: p.amount }));
    const cost = (expenses||[]).map(e => ({ date: e.created_at, cost: e.amount }));
    setPnL(daily.concat(cost));
  })(); }, [companyId]);

  const exportAll = () => {
    const blob = new Blob(['=== revenue.csv ===\n' + toCSV(rev) + '\n\n' + '=== pnl.csv ===\n' + toCSV(pnl)], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'financial_reports.txt'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Button variant="contained" onClick={exportAll}>Export Reports</Button>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}><DashboardCard title="Revenue"><DataTable data={rev} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Profit & Loss (recent)"><DataTable data={pnl} columns={[{ field: 'date', headerName: 'Date', type: 'date' }, { field: 'revenue', headerName: 'Revenue', type: 'currency' }, { field: 'cost', headerName: 'Cost', type: 'currency' }]} searchable pagination /></DashboardCard></Grid>
      </Grid>
    </Box>
  );
}
