import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getFinanceDrilldown } from '../../../supabase/api';

export default function BIAnalyticsTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const { data } = await getFinanceDrilldown(); setRows(data || []); })(); }, []);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><DashboardCard title="Finance Drill-down (Company → Branch → Route → Bus → Day)"><DataTable data={rows} columns={[{ field: 'date', headerName: 'Date', type: 'date' }, { field: 'branch_id', headerName: 'Branch' }, { field: 'route_id', headerName: 'Route' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'amount', headerName: 'Revenue', type: 'currency' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}


