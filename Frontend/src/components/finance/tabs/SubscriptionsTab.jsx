import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getCompanySubscription } from '../../../supabase/api';

export default function SubscriptionsTab() {
  const [row, setRow] = useState(null);
  useEffect(() => { (async () => { const { data } = await getCompanySubscription(); setRow(data || null); })(); }, []);
  const data = row ? [row] : [];
  return (
    <DashboardCard title="SaaS Subscription" variant="outlined">
      <DataTable data={data} columns={[{ field: 'plan', headerName: 'Plan' }, { field: 'status', headerName: 'Status' }, { field: 'current_period_end', headerName: 'Renews' }]} pagination={false} />
    </DashboardCard>
  );
}


