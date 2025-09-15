import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function TrainingTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => { const { data } = await supabase.from('certifications').select('id, staff_id, type, expires_at, status').eq('company_id', companyId).order('expires_at', { ascending: true }); setRows(data||[]); })(); }, [companyId]);
  return (
    <DashboardCard title="Training & Certification Tracking" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
      const staff = window.prompt('Staff user_id');
      const type = window.prompt('Certification/Training');
      const expires = window.prompt('Expires (YYYY-MM-DD)') || null;
      if (!staff || !type) return;
      await supabase.from('certifications').insert([{ company_id: companyId, staff_id: staff, type, issued_at: new Date().toISOString(), expires_at: expires ? new Date(expires).toISOString() : null, status: 'assigned' }]);
      const { data } = await supabase.from('certifications').select('id, staff_id, type, expires_at, status').eq('company_id', companyId).order('expires_at', { ascending: true });
      setRows(data||[]);
    }}>Assign</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'type', headerName: 'Type' }, { field: 'expires_at', headerName: 'Expires', type: 'date' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Mark Completed', icon: 'check', onClick: async (row)=>{ await supabase.from('certifications').update({ status: 'completed' }).eq('id', row.id); const { data } = await supabase.from('certifications').select('id, staff_id, type, expires_at, status').eq('company_id', companyId).order('expires_at', { ascending: true }); setRows(data||[]); } }]} />
    </DashboardCard>
  );
}
