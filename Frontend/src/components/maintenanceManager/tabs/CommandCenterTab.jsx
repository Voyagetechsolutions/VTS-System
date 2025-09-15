import React, { useEffect, useState } from 'react';
import { Grid, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem } from '@mui/material';
import DashboardCard, { StatsCard, QuickActionCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import CommandCenterMap from '../../companyAdmin/tabs/CommandCenterMap';
import { supabase } from '../../../supabase/client';
import { upsertMaintenanceLog } from '../../../supabase/api';

export default function CommandCenterTab() {
  const [kpis, setKpis] = useState({ fleet: 0, operation: 0, maintenance: 0, inspection: 0, tasksDone: 0, tasksPending: 0, downtimeHrs: 0, staffUtil: 0, baysBusy: 0, fuelingToday: 0 });
  const [alerts, setAlerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [buses, setBuses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [taskOpen, setTaskOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [form, setForm] = useState({ bus_id: '', title: '', priority: 'medium', notes: '', staff_id: '' });
  const companyId = window.companyId || localStorage.getItem('companyId');

  const load = async () => {
    const start = new Date(); start.setHours(0,0,0,0); const end = new Date(); end.setHours(23,59,59,999);
    const [{ data: busesData }, { data: maintTasks }, { data: repairs }, { data: staffTasks }, { data: inv }, { data: bays }, { data: fuelToday }, { data: staffList }] = await Promise.all([
      supabase.from('buses').select('bus_id, license_plate, status').eq('company_id', companyId),
      supabase.from('maintenance_tasks').select('id, status, priority').eq('company_id', companyId),
      supabase.from('repair_logs').select('duration_hours').eq('company_id', companyId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('staff_tasks').select('status, hours').eq('company_id', companyId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('inventory').select('item, quantity, min_threshold').eq('company_id', companyId),
      supabase.from('workshop_jobs').select('id, ended_at').eq('company_id', companyId).is('ended_at', null),
      supabase.from('fuel_logs').select('id').eq('company_id', companyId).gte('filled_at', start.toISOString()).lte('filled_at', end.toISOString()),
      supabase.from('users').select('user_id, name, role').eq('company_id', companyId).in('role', ['maintenance_tech','maintenance_manager'])
    ]);
    setBuses(busesData||[]);
    setStaff(staffList||[]);
    const fleet = (busesData||[]).length;
    const operation = (busesData||[]).filter(b => (b.status||'').toLowerCase().includes('active') || (b.status||'').toLowerCase().includes('operation')).length;
    const maintenance = (busesData||[]).filter(b => (b.status||'').toLowerCase().includes('maintenance') || (b.status||'').toLowerCase().includes('repair')).length;
    const inspection = (busesData||[]).filter(b => (b.status||'').toLowerCase().includes('inspection')).length;
    const tasksDone = (maintTasks||[]).filter(t => (t.status||'').toLowerCase()==='completed').length;
    const tasksPending = (maintTasks||[]).filter(t => (t.status||'').toLowerCase()!=='completed').length;
    const downtimeHrs = (repairs||[]).reduce((s,x)=> s + Number(x.duration_hours||0), 0);
    const hoursWorked = (staffTasks||[]).reduce((s,x)=> s + Number(x.hours||0), 0);
    const staffUtil = Math.min(100, Math.round((hoursWorked / Math.max(1, (staffTasks||[]).length*8)) * 100));
    const baysBusy = (bays||[]).length;
    const fuelingToday = (fuelToday||[]).length;
    const newKpis = { fleet, operation, maintenance, inspection, tasksDone, tasksPending, downtimeHrs, staffUtil, baysBusy, fuelingToday };
    setKpis(newKpis);
    try { await supabase.from('maintenance_kpis_daily').upsert([{ company_id: companyId, kpi_date: start.toISOString().slice(0,10), ...newKpis }], { onConflict: 'company_id,kpi_date' }); } catch {}
    const lowStock = (inv||[]).filter(x => Number(x.quantity||0) <= Number(x.min_threshold||0));
    const als = [];
    if (maintenance > 0) als.push({ created_at: new Date().toISOString(), type: 'maintenance', message: `${maintenance} buses under maintenance` });
    if ((lowStock||[]).length > 0) als.push({ created_at: new Date().toISOString(), type: 'inventory', message: `${lowStock.length} items below threshold` });
    setAlerts(als);
    setTasks((maintTasks||[]).slice(0, 20));
  };

  useEffect(() => { load(); }, [companyId]);

  const actions = [
    { label: 'Assign Task', icon: 'checklist', onClick: () => { setForm({ bus_id: '', title: '', priority: 'medium', notes: '', staff_id: '' }); setTaskOpen(true); } },
    { label: 'Schedule Maintenance', icon: 'wrench', onClick: () => { setForm({ bus_id: '', title: '', priority: 'medium', notes: '', staff_id: '' }); setSchedOpen(true); } },
    { label: 'Add Staff', icon: 'personAdd', onClick: () => { setForm({ bus_id: '', title: '', priority: 'medium', notes: '', staff_id: '' }); setStaffOpen(true); } },
    { label: 'Generate Report', icon: 'report', onClick: () => { setForm({ bus_id: '', title: '', priority: 'medium', notes: '', staff_id: '' }); setReportOpen(true); } },
  ];

  return (
    <>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DashboardCard title="Live Fleet Map" variant="elevated">
          <CommandCenterMap />
        </DashboardCard>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Fleet" value={kpis.fleet} icon="bus" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="In Operation" value={kpis.operation} icon="trendingUp" color="success" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Under Maintenance" value={kpis.maintenance} icon="wrench" color="warning" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Awaiting Inspection" value={kpis.inspection} icon="security" color="info" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Tasks Completed" value={kpis.tasksDone} icon="check" color="success" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Tasks Pending" value={kpis.tasksPending} icon="schedule" color="warning" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Downtime (hrs)" value={kpis.downtimeHrs} icon="timer" color="error" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Staff Utilization" value={`${kpis.staffUtil}%`} icon="percent" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Workshop Bays Busy" value={kpis.baysBusy} icon="garage" color="secondary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Fuel Logs Today" value={kpis.fuelingToday} icon="fuel" color="info" /></Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4}>
        <QuickActionCard title="Quick Actions" actions={actions} />
      </Grid>
      <Grid item xs={12} md={8}>
        <DashboardCard title="Notifications & Alerts" variant="outlined">
          <DataTable data={alerts} columns={[{ field: 'created_at', headerName: 'Time', type: 'date' }, { field: 'type', headerName: 'Type' }, { field: 'message', headerName: 'Message' }]} searchable pagination />
        </DashboardCard>
      </Grid>

      <Grid item xs={12}>
        <DashboardCard title="Recent Maintenance Tasks" variant="outlined">
          <DataTable data={tasks} columns={[{ field: 'title', headerName: 'Task' }, { field: 'status', headerName: 'Status' }, { field: 'priority', headerName: 'Priority' }]} searchable pagination />
        </DashboardCard>
      </Grid>
    </Grid>

    <Dialog open={taskOpen} onClose={()=>setTaskOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Assign Task</DialogTitle>
      <DialogContent>
        <Select fullWidth displayEmpty size="small" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 1 }}>
          <MenuItem value="">Select Bus...</MenuItem>
          {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
        </Select>
        <TextField fullWidth size="small" label="Task title" value={form.title} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} sx={{ mt: 2 }} />
        <Select fullWidth displayEmpty size="small" value={form.priority} onChange={e=>setForm(f=>({ ...f, priority: e.target.value }))} sx={{ mt: 2 }}>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
        </Select>
        <Select fullWidth displayEmpty size="small" value={form.staff_id} onChange={e=>setForm(f=>({ ...f, staff_id: e.target.value }))} sx={{ mt: 2 }}>
          <MenuItem value="">Assign to staff (optional)</MenuItem>
          {(staff||[]).map(s => <MenuItem key={s.user_id} value={s.user_id}>{s.name}</MenuItem>)}
        </Select>
        <TextField fullWidth size="small" label="Notes" value={form.notes} onChange={e=>setForm(f=>({ ...f, notes: e.target.value }))} sx={{ mt: 2 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>setTaskOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={async ()=>{ if(!form.bus_id || !form.title) return; await supabase.from('maintenance_tasks').insert([{ company_id: companyId, bus_id: form.bus_id, title: form.title, priority: form.priority, status: 'pending', notes: form.notes||null, assigned_to: form.staff_id||null }]); setTaskOpen(false); load(); }}>Save</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={schedOpen} onClose={()=>setSchedOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Schedule Maintenance</DialogTitle>
      <DialogContent>
        <Select fullWidth displayEmpty size="small" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 1 }}>
          <MenuItem value="">Select Bus...</MenuItem>
          {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
        </Select>
        <TextField fullWidth size="small" label="Notes" value={form.notes} onChange={e=>setForm(f=>({ ...f, notes: e.target.value }))} sx={{ mt: 2 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>setSchedOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={async ()=>{ if(!form.bus_id) return; await upsertMaintenanceLog({ bus_id: form.bus_id, notes: form.notes||null, status: 'scheduled' }); setSchedOpen(false); load(); }}>Schedule</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={staffOpen} onClose={()=>setStaffOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Add Staff</DialogTitle>
      <DialogContent>
        <TextField fullWidth size="small" label="Name" value={form.title} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} sx={{ mt: 1 }} />
        <TextField fullWidth size="small" label="Email" value={form.notes} onChange={e=>setForm(f=>({ ...f, notes: e.target.value }))} sx={{ mt: 2 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>setStaffOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={async ()=>{ if(!form.title || !form.notes) return; await supabase.from('users').insert([{ company_id: companyId, name: form.title, email: form.notes, role: 'maintenance_tech', is_active: true }]); setStaffOpen(false); load(); }}>Add</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={reportOpen} onClose={()=>setReportOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Generate Bus Report</DialogTitle>
      <DialogContent>
        <Select fullWidth displayEmpty size="small" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 1 }}>
          <MenuItem value="">Select Bus...</MenuItem>
          {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>setReportOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={async ()=>{ if(!form.bus_id) return; await supabase.from('reports_queue').insert([{ company_id: companyId, type: 'bus_report', params: { bus_id: form.bus_id } }]); alert('Report generation queued'); setReportOpen(false); }}>Generate</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
