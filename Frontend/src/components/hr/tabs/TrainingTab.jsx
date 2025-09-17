import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Button } from '@mui/material';

export default function TrainingTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: '', type: '', expires: '' });
  useEffect(() => { (async () => { const { data } = await supabase.from('certifications').select('id, staff_id, type, expires_at, status').eq('company_id', companyId).order('expires_at', { ascending: true }); setRows(data||[]); })(); }, [companyId]);
  return (
    <DashboardCard title="Training & Certification Tracking" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>setOpen(true)}>Assign</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'type', headerName: 'Type' }, { field: 'expires_at', headerName: 'Expires', type: 'date' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Mark Completed', icon: 'check', onClick: async (row)=>{ await supabase.from('certifications').update({ status: 'completed' }).eq('id', row.id); const { data } = await supabase.from('certifications').select('id, staff_id, type, expires_at, status').eq('company_id', companyId).order('expires_at', { ascending: true }); setRows(data||[]); } }]} />
      <Dialog open={open} onClose={()=>setOpen(false)}>
        <DialogTitle>Assign Training/Certification</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Staff user_id" value={form.staff_id} onChange={e=>setForm(f=>({...f, staff_id: e.target.value}))} fullWidth />
            <TextField label="Certification/Training" value={form.type} onChange={e=>setForm(f=>({...f, type: e.target.value}))} fullWidth />
            <TextField label="Expires (YYYY-MM-DD)" type="date" InputLabelProps={{ shrink: true }} value={form.expires} onChange={e=>setForm(f=>({...f, expires: e.target.value}))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{
            if (!form.staff_id || !form.type) return;
            await supabase.from('certifications').insert([{ company_id: companyId, staff_id: form.staff_id, type: form.type, issued_at: new Date().toISOString(), expires_at: form.expires ? new Date(form.expires).toISOString() : null, status: 'assigned' }]);
            const { data } = await supabase.from('certifications').select('id, staff_id, type, expires_at, status').eq('company_id', companyId).order('expires_at', { ascending: true });
            setRows(data||[]);
            setOpen(false); setForm({ staff_id: '', type: '', expires: '' });
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardCard>
  );
}
