import React, { useEffect, useState, useCallback } from 'react';
import { Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, Stack } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function TasksWorkflowTab() {
  const [rows, setRows] = useState([]);
  const [bus, setBus] = useState('');
  const [type, setType] = useState('');
  const [assignee, setAssignee] = useState('');
  const companyId = window.companyId || localStorage.getItem('companyId');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: '', priority: 'medium', bus_id: '', staff_id: '', description: '', assigned_to: '', due_date: '' });
  const [buses, setBuses] = useState([]);
  const [staff, setStaff] = useState([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('maintenance_tasks').select('task_id, bus_id, type, description, status, assigned_to, due_date, created_at').eq('company_id', companyId).order('created_at', { ascending: false });
    setRows(data || []);
  }, [companyId]);
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [load]);

  useEffect(() => { (async ()=>{ try { const [{ data: bs }, { data: st }] = await Promise.all([
    supabase.from('buses').select('bus_id, license_plate').eq('company_id', companyId),
    supabase.from('users').select('user_id, name, role').eq('company_id', companyId),
  ]); setBuses(bs||[]); setStaff(st||[]); } catch (error) { console.warn('Failed to load buses/staff:', error); setBuses([]); setStaff([]); } })(); }, [companyId]);

  const startTask = async (row) => { await supabase.from('maintenance_tasks').update({ status: 'in_progress' }).eq('id', row.id); load(); };
  const completeTask = async (row) => {
    const hours = Number(prompt('Labor hours?') || 0);
    const rate = Number(prompt('Labor rate?') || 0);
    const parts = Number(prompt('Parts cost?') || 0);
    const total = (hours * rate) + parts;
    await supabase.from('maintenance_tasks').update({ status: 'completed', labor_hours: hours, labor_rate: rate, parts_cost: parts, total_cost: total }).eq('id', row.id);
    try { await supabase.from('expenses').insert({ company_id: companyId, category: 'maintenance', bus_id: row.bus_id, amount: total }); } catch {}
    load();
  };

  const outsourceTask = async (row) => {
    const vendor = prompt('Vendor ID (optional)');
    const notes = prompt('Notes for outsourcing');
    await supabase.from('maintenance_tasks').update({ outsourced: true, vendor_id: vendor || null, outsourced_notes: notes || null, status: 'outsourced' }).eq('id', row.id);
    load();
  };

  const addTask = async () => {
    if (!form.title || !form.bus_id || !form.staff_id) return;
    try { await supabase.from('maintenance_tasks').insert([{ company_id: companyId, bus_id: form.bus_id, type: form.type, description: form.description, assigned_to: form.assigned_to, due_date: form.due_date }]); setForm({ bus_id: '', type: '', description: '', assigned_to: '', due_date: '' }); load(); } catch (error) { console.error('Failed to create task:', error); }
    setForm({ title: '', type: '', priority: 'medium', bus_id: '', staff_id: '', description: '', assigned_to: '', due_date: '' });
    load();
  };

  const filtered = rows.filter(r => (
    (bus ? String(r.bus_id).includes(bus) : true) &&
    (type ? String(r.type||'').toLowerCase().includes(type.toLowerCase()) : true) &&
    (assignee ? String(r.staff_id||'').includes(assignee) : true)
  ));

  return (
    <Box>
      <DashboardCard title="Tasks" variant="outlined" headerAction={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" label="Bus" value={bus} onChange={e => setBus(e.target.value)} />
          <TextField size="small" label="Type" value={type} onChange={e => setType(e.target.value)} />
          <TextField size="small" label="Assignee" value={assignee} onChange={e => setAssignee(e.target.value)} />
          <Button size="small" variant="contained" onClick={()=>setAddOpen(true)}>Add Task</Button>
        </Box>
      }>
        <DataTable
          data={filtered}
          columns={[{ field: 'bus_id', headerName: 'Bus' }, { field: 'title', headerName: 'Task' }, { field: 'type', headerName: 'Type' }, { field: 'priority', headerName: 'Priority' }, { field: 'status', headerName: 'Status' }, { field: 'total_cost', headerName: 'Cost' }]}
          rowActions={[{ label: 'Start', icon: 'play', onClick: (row) => startTask(row) }, { label: 'Complete', icon: 'check', onClick: (row) => completeTask(row) }, { label: 'Outsource', icon: 'handover', onClick: (row) => outsourceTask(row) }]}
          searchable
          pagination
        />
      </DashboardCard>

      <Dialog open={addOpen} onClose={()=>setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Maintenance Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={form.title} onChange={e=>setForm(f=>({...f, title: e.target.value}))} fullWidth />
            <TextField label="Type" value={form.type} onChange={e=>setForm(f=>({...f, type: e.target.value}))} fullWidth />
            <Select displayEmpty value={form.priority} onChange={e=>setForm(f=>({...f, priority: e.target.value}))}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
            <Select displayEmpty value={form.bus_id} onChange={e=>setForm(f=>({...f, bus_id: e.target.value}))}>
              <MenuItem value="">Select Bus...</MenuItem>
              {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
            </Select>
            <Select displayEmpty value={form.staff_id} onChange={e=>setForm(f=>({...f, staff_id: e.target.value}))}>
              <MenuItem value="">Assign Staff...</MenuItem>
              {(staff||[]).map(s => <MenuItem key={s.user_id} value={s.user_id}>{s.name} • {s.role}</MenuItem>)}
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addTask}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
