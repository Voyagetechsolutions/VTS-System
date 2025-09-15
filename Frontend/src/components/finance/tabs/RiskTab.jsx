import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function RiskTab() {
  const [factors, setFactors] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: rf }, { data: rs }] = await Promise.all([
      supabase.from('risk_factors').select('*').eq('company_id', companyId).order('captured_at', { ascending: false }),
      supabase.from('risk_scenarios').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    ]);
    setFactors(rf || []); setScenarios(rs || []);
  })(); }, [companyId]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><DashboardCard title="Risk Factors"><DataTable data={factors} columns={[{ field: 'captured_at', headerName: 'Date', type: 'date' }, { field: 'name', headerName: 'Factor' }, { field: 'value', headerName: 'Value' }, { field: 'unit', headerName: 'Unit' }]} searchable pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={6}><DashboardCard title="Scenarios & Sensitivity"><DataTable data={scenarios} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'name', headerName: 'Scenario' }, { field: 'assumption', headerName: 'Assumption' }, { field: 'impact', headerName: 'Impact' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}


