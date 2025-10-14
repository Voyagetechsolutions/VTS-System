import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function RefundsTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => {
    const { data } = await supabase.from('refunds').select('id, booking_id, amount, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [companyId]);
  const process = async (row) => { await supabase.from('refunds').update({ status: 'completed' }).eq('id', row.id); load(); };
  return (
    <DashboardCard title="Refunds & Adjustments" variant="outlined">
      <DataTable data={rows} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'booking_id', headerName: 'Booking' }, { field: 'amount', headerName: 'Amount', type: 'currency' }, { field: 'status', headerName: 'Status' }]} rowActions={[{ label: 'Process', icon: 'check', onClick: (row) => process(row) }]} searchable pagination />
    </DashboardCard>
  );
}
