import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getSubsidies } from '../../../supabase/api';

export default function SubsidiesTab() {
  const [rows, setRows] = useState([]);
  const load = async () => { const { data } = await getSubsidies(); setRows(data || []); };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);
  return (
    <DashboardCard title="Subsidies & Public Funding" variant="outlined">
      <DataTable data={rows} columns={[{ field: 'program_name', headerName: 'Program' }, { field: 'period', headerName: 'Period' }, { field: 'claimed_amount', headerName: 'Claimed', type: 'currency' }, { field: 'approved_amount', headerName: 'Approved', type: 'currency' }, { field: 'status', headerName: 'Status' }]} searchable pagination />
    </DashboardCard>
  );
}


