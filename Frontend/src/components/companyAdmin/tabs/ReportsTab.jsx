import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { supabase } from '../../../supabase/client';
import PieChart from '../charts/PieChart';

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  useEffect(() => {
    (async () => {
      const companyId = window.companyId;
      const { data: routeRanks } = await supabase.from('route_rankings').select('*').eq('company_id', companyId).limit(10);
      const topRoutes = (routeRanks || []).map(r => ({ label: r.name, value: Number(r.score || 0) }));
      setReports(topRoutes);
    })();
  }, []);
  return (
    <Box>
      <Typography variant="h5">Reports & Analytics</Typography>
      <PieChart data={reports} />
      <Box mt={2}>
        <Button variant="contained">Export CSV</Button>
        <Button variant="outlined" sx={{ ml: 2 }}>Export PDF</Button>
      </Box>
    </Box>
  );
}
