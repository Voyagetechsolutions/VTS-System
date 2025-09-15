import React, { useEffect, useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function TasksWorkflowTab() {
  const [rows, setRows] = useState([]);
  const [bus, setBus] = useState('');
  const [type, setType] = useState('');
  const [assignee, setAssignee] = useState('');
  const companyId = window.companyId || localStorage.getItem('companyId');

  const load = async () => {
    let q = supabase.from('maintenance_tasks').select('id, bus_id, title, type, status, priority, staff_id').eq('company_id', companyId);
    const { data } = await q;
    setRows(data || []);
  };
  useEffect(() => { load(); }, [companyId]);

  const startTask = async (row) => { await supabase.from('maintenance_tasks').update({ status: 'in_progress' }).eq('id', row.id); load(); };
  const completeTask = async (row) => {
    const hours = Number(prompt('Labor hours?') || 0);
    const rate = Number(prompt('Labor rate?') || 0);
    const parts = Number(prompt('Parts cost?') || 0);
    const total = (hours * rate) + parts;
    await supabase.from('maintenance_tasks').update({ status: 'completed', labor_hours: hours, labor_rate: rate, parts_cost: parts, total_cost: total }).eq('id', row.id);
    // mirror to Finance expenses
    try { await supabase.from('expenses').insert({ company_id: companyId, category: 'maintenance', bus_id: row.bus_id, amount: total }); } catch {}
    load();
  };

  const outsourceTask = async (row) => {
    const vendor = prompt('Vendor ID (optional)');
    const notes = prompt('Notes for outsourcing');
    await supabase.from('maintenance_tasks').update({ outsourced: true, vendor_id: vendor || null, outsourced_notes: notes || null, status: 'outsourced' }).eq('id', row.id);
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
    </Box>
  );
}
