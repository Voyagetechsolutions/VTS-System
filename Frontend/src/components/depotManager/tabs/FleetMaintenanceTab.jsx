import React, { useEffect, useState } from 'react';
import { Grid, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function FleetMaintenanceTab() {
  const [health, setHealth] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [downtime, setDowntime] = useState([]);
  const [taskOpen, setTaskOpen] = useState(false);
  const [repairOpen, setRepairOpen] = useState(false);
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState({ bus_id: '', title: '', priority: 'medium', notes: '', parts: '', hours: 0 });
  const companyId = window.companyId || localStorage.getItem('companyId');

  const load = async () => {
    const [{ data: buses }, { data: maint }, { data: logs }] = await Promise.all([
      supabase.from('buses').select('bus_id, license_plate, status, mileage').eq('company_id', companyId),
      supabase.from('maintenance_tasks').select('id, bus_id, title, status, priority').eq('company_id', companyId),
      supabase.from('repair_logs').select('id, bus_id, incident_id, notes, parts_used, duration_hours, created_at').eq('company_id', companyId),
    ]);
    setHealth(buses || []);
    setTasks(maint || []);
    setRepairs(logs || []);
    const dt = (logs||[]).map(x => ({ bus_id: x.bus_id, hours: x.duration_hours, date: x.created_at }));
    setDowntime(dt);
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [companyId]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Fleet Health" variant="outlined">
          <DataTable data={health} columns={[{ field: 'license_plate', headerName: 'Plate' }, { field: 'status', headerName: 'Status' }, { field: 'mileage', headerName: 'Mileage' }]} searchable pagination />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Maintenance Tasks" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>{ setForm({ bus_id: '', title: '', priority: 'medium', notes: '', parts: '', hours: 0 }); setTaskOpen(true); }}>Add</ModernButton>}>
          <DataTable data={tasks} columns={[{ field: 'title', headerName: 'Task' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'status', headerName: 'Status' }, { field: 'priority', headerName: 'Priority' }]} searchable pagination rowActions={[{ label: 'Complete', icon: 'check', onClick: async (row)=>{ await supabase.from('maintenance_tasks').update({ status: 'completed' }).eq('id', row.id); load(); } }]} />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Repair Logs" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>{ setForm({ bus_id: '', title: '', priority: 'medium', notes: '', parts: '', hours: 0 }); setRepairOpen(true); }}>Log</ModernButton>}>
          <DataTable data={repairs} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'bus_id', headerName: 'Bus' }, { field: 'incident_id', headerName: 'Incident' }, { field: 'notes', headerName: 'Notes' }, { field: 'parts_used', headerName: 'Parts' }]} searchable pagination />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Downtime Analytics" variant="outlined">
          <DataTable data={downtime} columns={[{ field: 'bus_id', headerName: 'Bus' }, { field: 'hours', headerName: 'Hours' }, { field: 'date', headerName: 'Date', type: 'date' }]} searchable pagination />
        </DashboardCard>
      </Grid>

      <Dialog open={taskOpen} onClose={()=>setTaskOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Maintenance Task</DialogTitle>
        <DialogContent>
          <Select fullWidth displayEmpty size="small" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 1 }}>
            <MenuItem value="">Select Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
          </Select>
          <TextField fullWidth size="small" label="Task" value={form.title} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} sx={{ mt: 2 }} />
          <Select fullWidth displayEmpty size="small" value={form.priority} onChange={e=>setForm(f=>({ ...f, priority: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
          <TextField fullWidth size="small" label="Notes" value={form.notes} onChange={e=>setForm(f=>({ ...f, notes: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setTaskOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.bus_id || !form.title) return; await supabase.from('maintenance_tasks').insert([{ company_id: companyId, bus_id: form.bus_id, title: form.title, priority: form.priority, status: 'open', notes: form.notes||null }]); setTaskOpen(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={repairOpen} onClose={()=>setRepairOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Log Repair</DialogTitle>
        <DialogContent>
          <Select fullWidth displayEmpty size="small" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 1 }}>
            <MenuItem value="">Select Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
          </Select>
          <TextField fullWidth size="small" label="Notes" value={form.notes} onChange={e=>setForm(f=>({ ...f, notes: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" label="Parts used" value={form.parts} onChange={e=>setForm(f=>({ ...f, parts: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" type="number" label="Downtime (hours)" value={form.hours} onChange={e=>setForm(f=>({ ...f, hours: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setRepairOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.bus_id || !form.notes) return; await supabase.from('repair_logs').insert([{ company_id: companyId, bus_id: form.bus_id, notes: form.notes, parts_used: form.parts||null, duration_hours: Number(form.hours||0) }]); setRepairOpen(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
