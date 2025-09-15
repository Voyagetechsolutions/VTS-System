import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function ShiftsTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => { const { data } = await supabase.from('staff_shifts').select('id, staff_id, branch_id, start_time, end_time, role, status').eq('company_id', companyId).order('start_time', { ascending: false }); setRows(data||[]); };
  useEffect(() => { load(); }, [companyId]);
  return (
    <DashboardCard title="Shifts" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
      const staff = window.prompt('Staff user_id');
      const start = window.prompt('Start ISO (YYYY-MM-DD HH:mm)');
      const end = window.prompt('End ISO (YYYY-MM-DD HH:mm)');
      const role = window.prompt('Role') || null;
      if (!staff || !start || !end) return;
      await supabase.from('staff_shifts').insert([{ company_id: companyId, staff_id: staff, start_time: new Date(start).toISOString(), end_time: new Date(end).toISOString(), role, status: 'scheduled' }]);
      load();
    }}>Schedule</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'start_time', headerName: 'Start', type: 'date' }, { field: 'end_time', headerName: 'End', type: 'date' }, { field: 'role', headerName: 'Role' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Complete', icon: 'check', onClick: async (row)=>{ await supabase.from('staff_shifts').update({ status: 'completed' }).eq('id', row.id); load(); } }]} />
    </DashboardCard>
  );
}


