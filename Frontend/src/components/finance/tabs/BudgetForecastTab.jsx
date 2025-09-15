import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function BudgetForecastTab() {
  const [budgets, setBudgets] = useState([]);
  const [forecast, setForecast] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: b }, { data: f }] = await Promise.all([
      supabase.from('budgets').select('*').eq('company_id', companyId).order('period', { ascending: false }),
      supabase.from('forecast').select('*').eq('company_id', companyId).order('period', { ascending: false }),
    ]);
    setBudgets(b||[]); setForecast(f||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><DashboardCard title="Budgets">
        <ModernButton icon="add">Add Budget</ModernButton>
        <DataTable data={budgets} columns={[{ field: 'period', headerName: 'Period' }, { field: 'scope', headerName: 'Scope' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} searchable pagination />
      </DashboardCard></Grid>
      <Grid item xs={12} md={6}><DashboardCard title="Forecast">
        <DataTable data={forecast} columns={[{ field: 'period', headerName: 'Period' }, { field: 'metric', headerName: 'Metric' }, { field: 'value', headerName: 'Value' }]} searchable pagination />
      </DashboardCard></Grid>
    </Grid>
  );
}


