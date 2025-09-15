import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getLoyaltyWallets, getLoyaltyTxns } from '../../../supabase/api';

export default function LoyaltyTab() {
  const [wallets, setWallets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [txns, setTxns] = useState([]);
  useEffect(() => { (async () => { const { data } = await getLoyaltyWallets(); setWallets(data || []); })(); }, []);
  const onSelect = async (row) => { setSelected(row); const { data } = await getLoyaltyTxns(row.id); setTxns(data || []); };
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><DashboardCard title="Loyalty Wallets"><DataTable data={wallets} columns={[{ field: 'customer_id', headerName: 'Customer' }, { field: 'balance', headerName: 'Balance', type: 'currency' }, { field: 'updated_at', headerName: 'Updated' }]} searchable pagination rowActions={[{ label: 'View', icon: 'view', onClick: onSelect }]} /></DashboardCard></Grid>
      <Grid item xs={12} md={6}><DashboardCard title={`Transactions ${selected ? `for ${selected.customer_id}` : ''}`}><DataTable data={txns} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'type', headerName: 'Type' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}


