import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listDriverKPIs } from '../../../supabase/api';

export default function PerformanceTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const r = await listDriverKPIs(); setRows(r.data || []); })(); }, []);
  return (
    <DashboardCard title="Performance & Feedback" variant="outlined">
      <DataTable
        data={rows}
        columns={[
          { field: 'period', headerName: 'Period' },
          { field: 'on_time_pct', headerName: 'On-time %' },
          { field: 'trips_completed', headerName: 'Trips' },
          { field: 'incidents', headerName: 'Incidents' },
          { field: 'rating', headerName: 'Rating' },
        ]}
        searchable
        pagination
      />
    </DashboardCard>
  );
}


