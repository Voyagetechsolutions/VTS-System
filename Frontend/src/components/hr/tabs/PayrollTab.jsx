import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function PayrollTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => { const { data } = await supabase.from('payroll').select('id, staff_id, period, base, overtime, bonus, deductions, net_pay, status').eq('company_id', companyId).order('period', { ascending: false }); setRows(data||[]); })(); }, [companyId]);
  return (
    <DashboardCard title="Payroll & Compensation" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
      const staff = window.prompt('Staff user_id');
      const period = window.prompt('Period (YYYY-MM)');
      const base = Number(window.prompt('Base') || 0);
      const overtime = Number(window.prompt('Overtime') || 0);
      const bonus = Number(window.prompt('Bonus') || 0);
      const deductions = Number(window.prompt('Deductions') || 0);
      const net_pay = base + overtime + bonus - deductions;
      if (!staff || !period) return;
      await supabase.from('payroll').insert([{ company_id: companyId, staff_id: staff, period, base, overtime, bonus, deductions, net_pay, status: 'draft' }]);
      const { data } = await supabase.from('payroll').select('id, staff_id, period, base, overtime, bonus, deductions, net_pay, status').eq('company_id', companyId).order('period', { ascending: false });
      setRows(data||[]);
    }}>Add</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'period', headerName: 'Period' }, { field: 'net_pay', headerName: 'Net Pay', type: 'currency' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Approve', icon: 'check', onClick: async (row)=>{ await supabase.from('payroll').update({ status: 'approved' }).eq('id', row.id); const { data } = await supabase.from('payroll').select('id, staff_id, period, base, overtime, bonus, deductions, net_pay, status').eq('company_id', companyId).order('period', { ascending: false }); setRows(data||[]); } }]} />
    </DashboardCard>
  );
}
