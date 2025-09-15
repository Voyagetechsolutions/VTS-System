import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getContracts, getContractReports } from '../../../supabase/api';

export default function ContractsTab() {
  const [contracts, setContracts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reports, setReports] = useState([]);
  useEffect(() => { (async () => { const { data } = await getContracts(); setContracts(data || []); })(); }, []);
  const onView = async (row) => { setSelected(row); const { data } = await getContractReports(row.id); setReports(data || []); };
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><DashboardCard title="Contracts & Tenders"><DataTable data={contracts} columns={[{ field: 'name', headerName: 'Name' }, { field: 'type', headerName: 'Type' }, { field: 'start_date', headerName: 'Start', type: 'date' }, { field: 'end_date', headerName: 'End', type: 'date' }, { field: 'expected_revenue', headerName: 'Expected Revenue', type: 'currency' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Open', icon: 'launch', onClick: onView }]} /></DashboardCard></Grid>
      <Grid item xs={12} md={6}><DashboardCard title={`Reports ${selected ? `for ${selected.name}` : ''}`}><DataTable data={reports} columns={[{ field: 'period', headerName: 'Period' }, { field: 'revenue', headerName: 'Revenue', type: 'currency' }, { field: 'cost', headerName: 'Cost', type: 'currency' }, { field: 'profit', headerName: 'Profit', type: 'currency' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}


