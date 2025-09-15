import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function CostControlTab() {
  const [routeCosts, setRouteCosts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: rc }, { data: al }] = await Promise.all([
      supabase.from('route_costs').select('*').eq('company_id', companyId),
      supabase.from('finance_alerts').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    ]);
    setRouteCosts(rc||[]); setAlerts(al||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}><DashboardCard title="Cost per Route/Bus/Depot"><DataTable data={routeCosts} columns={[{ field: 'route_id', headerName: 'Route' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'branch_id', headerName: 'Depot/Branch' }, { field: 'cost_per_km', headerName: 'Cost per km' }, { field: 'cost_per_passenger', headerName: 'Cost per passenger' }]} searchable pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={4}><DashboardCard title="High Expense Alerts"><DataTable data={alerts} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'type', headerName: 'Type' }, { field: 'message', headerName: 'Message' }]} pagination /></DashboardCard></Grid>
    </Grid>
  );
}


