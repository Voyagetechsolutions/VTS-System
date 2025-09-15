import React, { useEffect, useState } from 'react';
import { Grid, Button, TextField } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function InventoryTab() {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  const [po, setPO] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: s }, { data: u }, { data: p }] = await Promise.all([
      supabase.from('inventory').select('id, item, quantity, min_threshold, unit').eq('company_id', companyId),
      supabase.from('inventory_usage').select('id, item, bus_id, quantity, used_at').eq('company_id', companyId),
      supabase.from('purchase_orders').select('id, item, quantity, status, expected_at').eq('company_id', companyId),
    ]);
    setStock(s||[]); setUsage(u||[]); setPO(p||[]);
  })(); }, [companyId]);
  const scanBarcode = async () => {
    const code = prompt('Scan/Enter Part Code');
    if (!code) return;
    const qty = Number(prompt('Quantity used?') || 1);
    await supabase.from('inventory_usage').insert({ company_id: companyId, item: code, quantity: qty });
    await supabase.from('inventory').update({ quantity: supabase.rpc ? undefined : undefined }).eq('company_id', companyId).eq('item', code); // placeholder; real decrement via trigger/RPC
    const { data: s } = await supabase.from('inventory').select('id, item, quantity, min_threshold, unit').eq('company_id', companyId);
    setStock(s||[]);
  };

  const autoOrderLow = async () => {
    const low = (stock||[]).filter(x => Number(x.quantity||0) <= Number(x.min_threshold||0));
    if (!low.length) return alert('No low stock items.');
    const rows = low.map(x => ({ company_id: companyId, item: x.item, quantity: (x.min_threshold||0) * 2, status: 'ordered' }));
    await supabase.from('purchase_orders').insert(rows);
    const { data: p } = await supabase.from('purchase_orders').select('id, item, quantity, status, expected_at').eq('company_id', companyId);
    setPO(p||[]);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}><DashboardCard title="Stock" variant="outlined" action={<Button variant="contained" onClick={scanBarcode}>Scan/Use Part</Button>}><DataTable data={stock} columns={[{ field: 'item', headerName: 'Item' }, { field: 'quantity', headerName: 'Qty' }, { field: 'min_threshold', headerName: 'Min' }, { field: 'unit', headerName: 'Unit' }]} searchable pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={4}><DashboardCard title="Usage" variant="outlined"><DataTable data={usage} columns={[{ field: 'item', headerName: 'Item' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'quantity', headerName: 'Qty' }, { field: 'used_at', headerName: 'Used', type: 'date' }]} searchable pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={4}><DashboardCard title="Procurement" variant="outlined" action={<Button variant="outlined" onClick={autoOrderLow}>Auto-Order Low Stock</Button>}><DataTable data={po} columns={[{ field: 'item', headerName: 'Item' }, { field: 'quantity', headerName: 'Qty' }, { field: 'status', headerName: 'Status' }, { field: 'expected_at', headerName: 'ETA', type: 'date' }]} searchable pagination /></DashboardCard></Grid>
    </Grid>
  );
}
