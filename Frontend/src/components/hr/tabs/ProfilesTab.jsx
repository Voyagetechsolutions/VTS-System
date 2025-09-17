import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Button, Select, MenuItem } from '@mui/material';

export default function ProfilesTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '' });
  useEffect(() => { (async () => { const { data } = await supabase.from('users').select('user_id, name, role, email, employment_status, branch_id').eq('company_id', companyId); setRows(data||[]); })(); }, [companyId]);
  return (
    <DashboardCard title="Staff Profiles & Roles" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>setOpen(true)}>Add Employee</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'name', headerName: 'Name' }, { field: 'role', headerName: 'Role' }, { field: 'email', headerName: 'Email' }, { field: 'employment_status', headerName: 'Status' }, { field: 'branch_id', headerName: 'Branch' }]} searchable pagination rowActions={[{ label: 'Deactivate', icon: 'delete', onClick: async (row) => { await supabase.from('users').update({ is_active: false }).eq('user_id', row.user_id); const { data } = await supabase.from('users').select('user_id, name, role, email, employment_status, branch_id').eq('company_id', companyId); setRows(data||[]); } }]} />
      <Dialog open={open} onClose={()=>setOpen(false)}>
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full name" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} fullWidth />
            <TextField label="Email" value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))} fullWidth />
            <Select displayEmpty value={form.role} onChange={e=>setForm(f=>({...f, role: e.target.value}))} fullWidth>
              <MenuItem value="">Select Role</MenuItem>
              <MenuItem value="driver">Driver</MenuItem>
              <MenuItem value="booking_officer">Booking Officer</MenuItem>
              <MenuItem value="boarding_operator">Boarding Operator</MenuItem>
              <MenuItem value="ops_manager">Operations Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{
            if (!form.name || !form.email || !form.role) return;
            await supabase.from('users').insert([{ company_id: companyId, name: form.name, email: String(form.email).toLowerCase(), role: form.role, is_active: true }]);
            const { data } = await supabase.from('users').select('user_id, name, role, email, employment_status, branch_id').eq('company_id', companyId);
            setRows(data||[]);
            setOpen(false); setForm({ name: '', email: '', role: '' });
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardCard>
  );
}
