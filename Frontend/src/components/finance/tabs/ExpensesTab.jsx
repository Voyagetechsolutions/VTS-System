import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function ExpensesTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => { const { data } = await supabase.from('expenses').select('id, category, amount, route_id, bus_id, created_at').eq('company_id', companyId).order('created_at', { ascending: false }); setRows(data||[]); })(); }, [companyId]);
  return (
    <DashboardCard title="Expenses & Cost Tracking" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
      const category = window.prompt('Category');
      const amt = Number(window.prompt('Amount') || 0);
      if (!category || !amt || Number.isNaN(amt)) return;
      await supabase.from('expenses').insert([{ company_id: companyId, category, amount: amt }]);
      const { data } = await supabase.from('expenses').select('id, category, amount, route_id, bus_id, created_at').eq('company_id', companyId).order('created_at', { ascending: false });
      setRows(data||[]);
    }}>Add</ModernButton>}>
      <DataTable data={rows} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'category', headerName: 'Category' }, { field: 'amount', headerName: 'Amount', type: 'currency' }, { field: 'route_id', headerName: 'Route' }, { field: 'bus_id', headerName: 'Bus' }]} searchable pagination />
    </DashboardCard>
  );
}
