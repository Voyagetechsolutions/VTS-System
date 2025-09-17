import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Button } from '@mui/material';

export default function PayrollTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: '', period: '', base: '', overtime: '', bonus: '', deductions: '' });
  useEffect(() => { (async () => { const { data } = await supabase.from('payroll').select('id, staff_id, period, base, overtime, bonus, deductions, net_pay, status').eq('company_id', companyId).order('period', { ascending: false }); setRows(data||[]); })(); }, [companyId]);
  return (
    <DashboardCard title="Payroll & Compensation" variant="outlined" headerAction={<ModernButton icon="add" onClick={()=>setOpen(true)}>Add</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'period', headerName: 'Period' }, { field: 'net_pay', headerName: 'Net Pay', type: 'currency' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Approve', icon: 'check', onClick: async (row)=>{ await supabase.from('payroll').update({ status: 'approved' }).eq('id', row.id); const { data } = await supabase.from('payroll').select('id, staff_id, period, base, overtime, bonus, deductions, net_pay, status').eq('company_id', companyId).order('period', { ascending: false }); setRows(data||[]); } }]} />
      <Dialog open={open} onClose={()=>setOpen(false)}>
        <DialogTitle>Add Payroll Entry</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Staff user_id" value={form.staff_id} onChange={e=>setForm(f=>({...f, staff_id: e.target.value}))} fullWidth />
            <TextField label="Period" type="month" value={form.period} onChange={e=>setForm(f=>({...f, period: e.target.value}))} fullWidth />
            <TextField label="Base" type="number" value={form.base} onChange={e=>setForm(f=>({...f, base: e.target.value}))} fullWidth />
            <TextField label="Overtime" type="number" value={form.overtime} onChange={e=>setForm(f=>({...f, overtime: e.target.value}))} fullWidth />
            <TextField label="Bonus" type="number" value={form.bonus} onChange={e=>setForm(f=>({...f, bonus: e.target.value}))} fullWidth />
            <TextField label="Deductions" type="number" value={form.deductions} onChange={e=>setForm(f=>({...f, deductions: e.target.value}))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{
            const base = Number(form.base||0), overtime = Number(form.overtime||0), bonus = Number(form.bonus||0), deductions = Number(form.deductions||0);
            if (!form.staff_id || !form.period) return;
            const net_pay = base + overtime + bonus - deductions;
            await supabase.from('payroll').insert([{ company_id: companyId, staff_id: form.staff_id, period: form.period, base, overtime, bonus, deductions, net_pay, status: 'draft' }]);
            const { data } = await supabase.from('payroll').select('id, staff_id, period, base, overtime, bonus, deductions, net_pay, status').eq('company_id', companyId).order('period', { ascending: false }); setRows(data||[]);
            setOpen(false); setForm({ staff_id: '', period: '', base: '', overtime: '', bonus: '', deductions: '' });
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardCard>
  );
}
