import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function ComplianceTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => { const { data } = await supabase.from('disciplinary_actions').select('id, staff_id, type, notes, action_date, status').eq('company_id', companyId).order('action_date', { ascending: false }); setRows(data||[]); };
  useEffect(() => { load(); }, [companyId]);
  return (
    <DashboardCard title="Compliance & Safety" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
      const staff = window.prompt('Staff user_id');
      const type = window.prompt('Action type (warning, suspension, alcohol_test, accident)') || 'warning';
      const notes = window.prompt('Notes') || null;
      await supabase.from('disciplinary_actions').insert([{ company_id: companyId, staff_id: staff, type, notes, action_date: new Date().toISOString(), status: 'open' }]);
      load();
    }}>Add Action</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'action_date', headerName: 'Date', type: 'date' }, { field: 'staff_id', headerName: 'Staff' }, { field: 'type', headerName: 'Type' }, { field: 'notes', headerName: 'Notes' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Resolve', icon: 'check', onClick: async (row)=>{ await supabase.from('disciplinary_actions').update({ status: 'resolved' }).eq('id', row.id); load(); } }]} />
    </DashboardCard>
  );
}


