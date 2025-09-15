import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function CashFlowTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const { data } = await supabase.from('cashflow').select('*').eq('company_id', companyId).order('date', { ascending: false });
    setRows(data || []);
  })(); }, [companyId]);
  return (
    <DashboardCard title="Cash Flow Management" subtitle="Daily position, projections, and reconciliations" variant="outlined">
      <ModernButton icon="download">Export</ModernButton>
      <DataTable data={rows} columns={[{ field: 'date', headerName: 'Date', type: 'date' }, { field: 'opening', headerName: 'Opening', type: 'currency' }, { field: 'inflow', headerName: 'Inflow', type: 'currency' }, { field: 'outflow', headerName: 'Outflow', type: 'currency' }, { field: 'closing', headerName: 'Closing', type: 'currency' }]} searchable pagination />
    </DashboardCard>
  );
}


