import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { supabase } from '../../../supabase/client';
import BarChart from '../../charts/BarChart';

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  useEffect(() => {
    (async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      const { data } = await supabase.rpc('generate_report', { p_company_id: window.companyId, p_start: start.toISOString(), p_end: end.toISOString() });
      const row = Array.isArray(data) && data.length ? data[0] : { total_bookings: 0, total_revenue: 0, seats_sold: 0 };
      setReports([{ label: 'Bookings', value: Number(row.total_bookings||0) }, { label: 'Revenue', value: Number(row.total_revenue||0) }, { label: 'Seats Sold', value: Number(row.seats_sold||0) }]);
    })();
  }, []);
  const exportCSV = () => {
    const head = ['Metric','Value'];
    const rows = (reports||[]).map(r => [r.label, r.value]);
    const csv = [head, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'daily_report.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <Box>
      <Typography variant="h5">Reports & Analytics</Typography>
      <BarChart data={reports} />
      <Box mt={2}>
        <Button variant="contained" onClick={exportCSV}>Export CSV</Button>
        <Button variant="outlined" sx={{ ml: 2 }}>Export PDF</Button>
      </Box>
    </Box>
  );
}
