import React, { useEffect, useState } from 'react';
import { Grid, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

function groupWeekly(rows) {
  const byWeek = new Map();
  (rows||[]).forEach(r => {
    const dt = new Date(r.filled_at || r.created_at || r.used_at || r.date || Date.now());
    const year = dt.getFullYear();
    const week = Math.floor(((dt - new Date(year,0,1)) / 86400000 + new Date(year,0,1).getDay() + 1) / 7);
    const key = `${year}-W${String(week).padStart(2,'0')}`;
    const prev = byWeek.get(key) || { liters: 0, cost: 0, count: 0 };
    byWeek.set(key, { liters: prev.liters + Number(r.liters||0), cost: prev.cost + Number(r.cost_per_liter||0) * Number(r.liters||0), count: prev.count + 1 });
  });
  return Array.from(byWeek.entries()).map(([week, v]) => ({ week, liters: v.liters, avg_cost_per_liter: v.count ? (v.cost / v.liters || 0) : 0 }));
}

export default function FuelEnergyTab() {
  const [fuel, setFuel] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bus_id: '', liters: 0, price: 0, pump_id: '', notes: '' });
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => {
    const { data } = await supabase.from('fuel_logs').select('id, bus_id, liters, cost_per_liter, filled_at, pump_id, notes').eq('company_id', companyId).order('filled_at', { ascending: false });
    setFuel(data || []);
    setWeekly(groupWeekly(data||[]));
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}><DashboardCard title="Fuel Logs" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>{ setForm({ bus_id: '', liters: 0, price: 0, pump_id: '', notes: '' }); setOpen(true); }}>Add</ModernButton>}><DataTable data={fuel} columns={[{ field: 'filled_at', headerName: 'Date', type: 'date' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'liters', headerName: 'Liters' }, { field: 'cost_per_liter', headerName: 'Cost/L' }, { field: 'pump_id', headerName: 'Pump' }, { field: 'notes', headerName: 'Notes' }]} searchable pagination /></DashboardCard></Grid>
      <Grid item xs={12} md={5}><DashboardCard title="Weekly Rollups" variant="outlined"><DataTable data={weekly} columns={[{ field: 'week', headerName: 'Week' }, { field: 'liters', headerName: 'Total Liters' }, { field: 'avg_cost_per_liter', headerName: 'Avg Cost/L' }]} pagination /></DashboardCard></Grid>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Fuel Log</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" label="Bus ID" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 1 }} />
          <TextField fullWidth size="small" type="number" label="Liters" value={form.liters} onChange={e=>setForm(f=>({ ...f, liters: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" type="number" label="Cost per liter" value={form.price} onChange={e=>setForm(f=>({ ...f, price: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" label="Pump ID" value={form.pump_id} onChange={e=>setForm(f=>({ ...f, pump_id: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" label="Notes" value={form.notes} onChange={e=>setForm(f=>({ ...f, notes: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.bus_id || !form.liters) return; await supabase.from('fuel_logs').insert([{ company_id: companyId, bus_id: form.bus_id, liters: Number(form.liters||0), cost_per_liter: Number(form.price||0), pump_id: form.pump_id||null, notes: form.notes||null }]); setOpen(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}


