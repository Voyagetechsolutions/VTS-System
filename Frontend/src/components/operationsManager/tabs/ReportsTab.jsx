import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, TextField } from '@mui/material';
import { getOpsReports } from '../../../supabase/api';
import BarChart from '../../charts/BarChart';

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  useEffect(() => {
    getOpsReports().then(({ data }) => setReports(data || []));
  }, []);
  const exportCSV = () => {
    const head = ['Label','Value'];
    const rows = (reports||[]).map(r => [r.label, r.value]);
    const csv = [head, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ops_reports.csv'; a.click(); URL.revokeObjectURL(url);
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
