import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function KPIsBenchmarkTab() {
  const [kpis, setKpis] = useState([]);
  const [routes, setRoutes] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: rkp }, { data: rp } ] = await Promise.all([
      supabase.rpc('finance_kpis', { p_company_id: companyId }),
      supabase.rpc('route_profitability', { p_company_id: companyId }),
    ]);
    setKpis(rkp||[]); setRoutes(rp||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}><DashboardCard title="Financial KPIs"><DataTable data={kpis} columns={[{ field: 'name', headerName: 'KPI' }, { field: 'value', headerName: 'Value' }, { field: 'unit', headerName: 'Unit' }]} pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={7}><DashboardCard title="Route Profitability"><DataTable data={routes} columns={[{ field: 'route_id', headerName: 'Route' }, { field: 'revenue', headerName: 'Revenue', type: 'currency' }, { field: 'cost', headerName: 'Cost', type: 'currency' }, { field: 'margin', headerName: 'Margin %' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}


