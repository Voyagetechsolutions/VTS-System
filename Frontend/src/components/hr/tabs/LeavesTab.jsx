import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function LeavesTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => { const { data } = await supabase.from('leaves').select('id, staff_id, type, start_date, end_date, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false }); setRows(data||[]); };
  useEffect(() => { load(); }, [companyId]);
  return (
    <DashboardCard title="Leaves & Absences" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
      const staff = window.prompt('Staff user_id');
      const type = window.prompt('Leave type (annual, sick, unpaid)') || 'annual';
      const start = window.prompt('Start date (YYYY-MM-DD)');
      const end = window.prompt('End date (YYYY-MM-DD)');
      if (!staff || !start || !end) return;
      await supabase.from('leaves').insert([{ company_id: companyId, staff_id: staff, type, start_date: start, end_date: end, status: 'pending' }]);
      load();
    }}>Request Leave</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'created_at', headerName: 'Requested', type: 'date' }, { field: 'staff_id', headerName: 'Staff' }, { field: 'type', headerName: 'Type' }, { field: 'start_date', headerName: 'Start' }, { field: 'end_date', headerName: 'End' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Approve', icon: 'check', onClick: async (row)=>{ await supabase.from('leaves').update({ status: 'approved' }).eq('id', row.id); load(); } }, { label: 'Reject', icon: 'cancel', onClick: async (row)=>{ await supabase.from('leaves').update({ status: 'rejected' }).eq('id', row.id); load(); } }]} />
    </DashboardCard>
  );
}


