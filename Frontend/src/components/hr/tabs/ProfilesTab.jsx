import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function ProfilesTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => { const { data } = await supabase.from('users').select('user_id, name, role, email, employment_status, branch_id').eq('company_id', companyId); setRows(data||[]); })(); }, [companyId]);
  return (
    <DashboardCard title="Staff Profiles & Roles" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
      const name = window.prompt('Full name');
      const email = window.prompt('Email');
      const role = window.prompt('Role (driver, booking_officer, depot_staff, maintenance_manager, admin)');
      if (!name || !email || !role) return;
      await supabase.from('users').insert([{ company_id: companyId, name, email: email.toLowerCase(), role, is_active: true }]);
      const { data } = await supabase.from('users').select('user_id, name, role, email, employment_status, branch_id').eq('company_id', companyId);
      setRows(data||[]);
    }}>Add Employee</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'name', headerName: 'Name' }, { field: 'role', headerName: 'Role' }, { field: 'email', headerName: 'Email' }, { field: 'employment_status', headerName: 'Status' }, { field: 'branch_id', headerName: 'Branch' }]} searchable pagination rowActions={[{ label: 'Deactivate', icon: 'delete', onClick: async (row) => { await supabase.from('users').update({ is_active: false }).eq('user_id', row.user_id); const { data } = await supabase.from('users').select('user_id, name, role, email, employment_status, branch_id').eq('company_id', companyId); setRows(data||[]); } }]} />
    </DashboardCard>
  );
}
