import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getEsgInitiatives } from '../../../supabase/api';

export default function ESGTab() {
  const [rows, setRows] = useState([]);
  const load = async () => { const { data } = await getEsgInitiatives(); setRows(data || []); };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);
  return (
    <DashboardCard title="ESG & Sustainability" variant="outlined">
      <DataTable data={rows} columns={[{ field: 'type', headerName: 'Type' }, { field: 'cost', headerName: 'Cost', type: 'currency' }, { field: 'incentive', headerName: 'Incentive', type: 'currency' }, { field: 'co2_saved_kg', headerName: 'CO₂ Saved (kg)' }]} searchable pagination />
    </DashboardCard>
  );
}


