import React, { useEffect, useState } from 'react';
import { Grid, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function InventoryTab() {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  const [procure, setProcure] = useState([]);
  const [stockOpen, setStockOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [procureOpen, setProcureOpen] = useState(false);
  const [form, setForm] = useState({ item: '', unit: 'pc', quantity: 0, min: 0, bus_id: '', eta: '' });
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: s }, { data: u }, { data: p }] = await Promise.all([
      supabase.from('inventory').select('id, item, quantity, min_threshold, unit').eq('company_id', companyId),
      supabase.from('inventory_usage').select('id, item, bus_id, quantity, used_at').eq('company_id', companyId),
      supabase.from('purchase_orders').select('id, item, quantity, status, expected_at').eq('company_id', companyId),
    ]);
    setStock(s||[]); setUsage(u||[]); setProcure(p||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <DashboardCard title="Stock Levels" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>{ setForm({ item: '', unit: 'pc', quantity: 0, min: 0 }); setStockOpen(true); }}>Add</ModernButton>}>
          <DataTable data={stock} columns={[{ field: 'item', headerName: 'Item' }, { field: 'quantity', headerName: 'Qty' }, { field: 'min_threshold', headerName: 'Min' }, { field: 'unit', headerName: 'Unit' }]} searchable pagination />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <DashboardCard title="Usage" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>{ setForm({ item: '', unit: 'pc', quantity: 0, min: 0, bus_id: '' }); setUsageOpen(true); }}>Log</ModernButton>}>
          <DataTable data={usage} columns={[{ field: 'item', headerName: 'Item' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'quantity', headerName: 'Qty' }, { field: 'used_at', headerName: 'Used', type: 'date' }]} searchable pagination />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <DashboardCard title="Procurement" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>{ setForm({ item: '', unit: 'pc', quantity: 0, min: 0, eta: '' }); setProcureOpen(true); }}>Order</ModernButton>}>
          <DataTable data={procure} columns={[{ field: 'item', headerName: 'Item' }, { field: 'quantity', headerName: 'Qty' }, { field: 'status', headerName: 'Status' }, { field: 'expected_at', headerName: 'ETA', type: 'date' }]} searchable pagination />
        </DashboardCard>
      </Grid>

      <Dialog open={stockOpen} onClose={()=>setStockOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Stock</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" label="Item" value={form.item} onChange={e=>setForm(f=>({ ...f, item: e.target.value }))} sx={{ mt: 1 }} />
          <TextField fullWidth size="small" label="Unit" value={form.unit} onChange={e=>setForm(f=>({ ...f, unit: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" type="number" label="Quantity" value={form.quantity} onChange={e=>setForm(f=>({ ...f, quantity: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" type="number" label="Min threshold" value={form.min} onChange={e=>setForm(f=>({ ...f, min: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setStockOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.item) return; await supabase.from('inventory').insert([{ company_id: companyId, item: form.item, unit: form.unit, quantity: Number(form.quantity||0), min_threshold: Number(form.min||0) }]); setStockOpen(false); const { data: s } = await supabase.from('inventory').select('id, item, quantity, min_threshold, unit').eq('company_id', companyId); setStock(s||[]); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={usageOpen} onClose={()=>setUsageOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Log Usage</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" label="Item" value={form.item} onChange={e=>setForm(f=>({ ...f, item: e.target.value }))} sx={{ mt: 1 }} />
          <TextField fullWidth size="small" label="Bus ID" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" type="number" label="Qty used" value={form.quantity} onChange={e=>setForm(f=>({ ...f, quantity: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setUsageOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.item || !form.bus_id || !form.quantity) return; await supabase.from('inventory_usage').insert([{ company_id: companyId, item: form.item, bus_id: form.bus_id, quantity: Number(form.quantity||0) }]); setUsageOpen(false); const { data: u } = await supabase.from('inventory_usage').select('id, item, bus_id, quantity, used_at').eq('company_id', companyId); setUsage(u||[]); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={procureOpen} onClose={()=>setProcureOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Purchase Order</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" label="Item" value={form.item} onChange={e=>setForm(f=>({ ...f, item: e.target.value }))} sx={{ mt: 1 }} />
          <TextField fullWidth size="small" type="number" label="Qty to order" value={form.quantity} onChange={e=>setForm(f=>({ ...f, quantity: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" label="Expected at (YYYY-MM-DD)" value={form.eta} onChange={e=>setForm(f=>({ ...f, eta: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setProcureOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.item || !form.quantity) return; const eta = form.eta ? new Date(form.eta).toISOString() : null; await supabase.from('purchase_orders').insert([{ company_id: companyId, item: form.item, quantity: Number(form.quantity||0), expected_at: eta }]); setProcureOpen(false); const { data: p } = await supabase.from('purchase_orders').select('id, item, quantity, status, expected_at').eq('company_id', companyId); setProcure(p||[]); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
