import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernTextField, ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
}

export default function RevenueTab() {
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [method, setMethod] = useState('');
  const companyId = window.companyId || localStorage.getItem('companyId');

  const load = async () => {
    let q = supabase.from('payments').select('payment_id, booking_id, amount, method, status, created_at, route_id, bus_id, branch_id').eq('company_id', companyId);
    if (fromDate) q = q.gte('created_at', new Date(fromDate).toISOString());
    if (toDate) q = q.lte('created_at', new Date(toDate).toISOString());
    if (method) q = q.eq('method', method);
    const { data } = await q.order('created_at', { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, [companyId, fromDate, toDate, method]);

  const exportCSV = () => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'revenue.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <DashboardCard title="Revenue & Trip Income" variant="outlined" headerAction={
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ModernTextField label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <ModernTextField label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <ModernTextField label="Method (cash/card/mobile)" value={method} onChange={e => setMethod(e.target.value)} />
        <ModernButton variant="outlined" icon="download" onClick={exportCSV}>Export CSV</ModernButton>
      </Box>
    }>
      <DataTable
        data={rows}
        columns={[
          { field: 'created_at', headerName: 'Date', type: 'date' },
          { field: 'amount', headerName: 'Amount', type: 'currency' },
          { field: 'method', headerName: 'Method' },
          { field: 'status', headerName: 'Status' },
          { field: 'route_id', headerName: 'Route' },
          { field: 'bus_id', headerName: 'Bus' },
          { field: 'branch_id', headerName: 'Branch' },
        ]}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
