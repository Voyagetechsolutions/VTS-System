import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function TransactionsTab() {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('payments').select('payment_id, booking_id, amount, method, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('refunds').select('id, booking_id, amount, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false }),
    ]);
    setPayments(p||[]); setRefunds(r||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><DashboardCard title="Payments" variant="outlined"><DataTable data={payments} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'amount', headerName: 'Amount', type: 'currency' }, { field: 'method', headerName: 'Method' }, { field: 'status', headerName: 'Status' }]} searchable pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={6}><DashboardCard title="Refunds" variant="outlined"><DataTable data={refunds} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'amount', headerName: 'Amount', type: 'currency' }, { field: 'status', headerName: 'Status' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}
