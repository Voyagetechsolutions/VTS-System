import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function InsuranceClaimsTab() {
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('insurance_policies').select('*').eq('company_id', companyId).order('renewal_date'),
      supabase.from('insurance_claims').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    ]);
    setPolicies(p||[]); setClaims(c||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}><DashboardCard title="Insurance Policies"><ModernButton icon="add">Add Policy</ModernButton><DataTable data={policies} columns={[{ field: 'policy_no', headerName: 'Policy No' }, { field: 'provider', headerName: 'Provider' }, { field: 'renewal_date', headerName: 'Renewal', type: 'date' }]} searchable pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={7}><DashboardCard title="Claims"><DataTable data={claims} columns={[{ field: 'incident_id', headerName: 'Incident' }, { field: 'amount', headerName: 'Amount', type: 'currency' }, { field: 'status', headerName: 'Status' }, { field: 'created_at', headerName: 'Date', type: 'date' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}


