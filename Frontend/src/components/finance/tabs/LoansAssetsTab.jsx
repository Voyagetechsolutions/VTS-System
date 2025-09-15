import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function LoansAssetsTab() {
  const [loans, setLoans] = useState([]);
  const [assets, setAssets] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: l }, { data: a }] = await Promise.all([
      supabase.from('loans').select('*').eq('company_id', companyId).order('start_date', { ascending: false }),
      supabase.from('assets').select('*').eq('company_id', companyId).order('acquired_at', { ascending: false }),
    ]);
    setLoans(l||[]); setAssets(a||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><DashboardCard title="Loans & Financing"><DataTable data={loans} columns={[{ field: 'lender', headerName: 'Lender' }, { field: 'amount', headerName: 'Amount', type: 'currency' }, { field: 'interest_rate', headerName: 'Interest %' }, { field: 'installment', headerName: 'Installment', type: 'currency' }, { field: 'status', headerName: 'Status' }]} searchable pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={6}><DashboardCard title="Assets & Depreciation"><DataTable data={assets} columns={[{ field: 'name', headerName: 'Asset' }, { field: 'type', headerName: 'Type' }, { field: 'value', headerName: 'Value', type: 'currency' }, { field: 'depreciation_rate', headerName: 'Depreciation %' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}


