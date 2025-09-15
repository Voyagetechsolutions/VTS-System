import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, TextField } from '@mui/material';
import { getCompanyRevenue } from '../../../supabase/api';
import BarChart from '../charts/BarChart';
import { supabase } from '../../../supabase/client';

export default function RevenueTab() {
  const [revenue, setRevenue] = useState([]);
  const [commission, setCommission] = useState(0);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  useEffect(() => {
    getCompanyRevenue().then(({ data }) => setRevenue(data || []));
  }, []);

  const calculateCommission = async () => {
    const companyId = window.companyId;
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start); end.setMonth(start.getMonth()+1);
    const { data, error } = await supabase.rpc('commission_due', { p_company_id: companyId, p_start: start.toISOString(), p_end: end.toISOString() });
    if (!error) setCommission(Number(data || 0));
  };
  return (
    <Box>
      <Typography variant="h5">Revenue & Billing</Typography>
      <BarChart data={revenue} />
      <Box mt={2}>
        <Button variant="contained">Download Invoice</Button>
        <Button variant="outlined" sx={{ ml: 2 }}>Export CSV</Button>
      </Box>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1">Commission (R2000 + 3.5% per seat)</Typography>
        <Box display="flex" gap={2} mt={1}>
          <TextField label="Month" type="month" value={month} onChange={e => setMonth(e.target.value)} />
          <Button variant="contained" onClick={calculateCommission}>Calculate</Button>
          <Typography variant="h6" sx={{ ml: 2 }}>Due: R {commission.toFixed(2)}</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
