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
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from('attendance').select('check_in, check_out, status').eq('company_id', companyId),
      supabase.from('payroll').select('period, net_pay').eq('company_id', companyId),
    ]);
    setAttendance(a||[]); setPayroll(p||[]);
  })(); }, [companyId]);

  const exportAll = () => {
    const blob = new Blob(['=== attendance.csv ===\n' + toCSV(attendance) + '\n\n' + '=== payroll.csv ===\n' + toCSV(payroll)], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'hr_reports.txt'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Button variant="contained" onClick={exportAll}>Export Reports</Button>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}><DashboardCard title="Attendance"><DataTable data={attendance} columns={[{ field: 'check_in', headerName: 'Check-in', type: 'date' }, { field: 'status', headerName: 'Status' }]} searchable pagination /></DashboardCard></Grid>
        <Grid item xs={12} md={6}><DashboardCard title="Payroll Summary"><DataTable data={payroll} columns={[{ field: 'period', headerName: 'Period' }, { field: 'net_pay', headerName: 'Net Pay', type: 'currency' }]} searchable pagination /></DashboardCard></Grid>
      </Grid>
    </Box>
  );
}
