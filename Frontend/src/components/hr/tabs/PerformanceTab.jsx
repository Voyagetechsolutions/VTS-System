import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function PerformanceTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => { const { data } = await supabase.from('performance_reviews').select('id, staff_id, reviewer_id, period, rating, feedback, created_at').eq('company_id', companyId).order('created_at', { ascending: false }); setRows(data||[]); };
  useEffect(() => { load(); }, [companyId]);
  return (
    <DashboardCard title="Performance Management" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
      const staff = window.prompt('Staff user_id');
      const reviewer = window.prompt('Reviewer user_id') || null;
      const period = window.prompt('Period (YYYY)') || null;
      const rating = Number(window.prompt('Rating (1-5)') || 0);
      const feedback = window.prompt('Feedback') || null;
      if (!staff || !rating) return;
      await supabase.from('performance_reviews').insert([{ company_id: companyId, staff_id: staff, reviewer_id: reviewer, period, rating, feedback }]);
      load();
    }}>Add Review</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'staff_id', headerName: 'Staff' }, { field: 'reviewer_id', headerName: 'Reviewer' }, { field: 'period', headerName: 'Period' }, { field: 'rating', headerName: 'Rating' }, { field: 'feedback', headerName: 'Feedback' }]} searchable pagination />
    </DashboardCard>
  );
}


