import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getSubscriptions, updateSubscription, getInvoices } from '../../../supabase/api';

export default function BillingDevTab() {
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [s, i] = await Promise.all([getSubscriptions(), getInvoices()]);
    setSubs(s.data || []);
    setInvoices(i.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DashboardCard title="Subscriptions" variant="outlined">
          <DataTable
            data={subs}
            loading={loading}
            columns={[
              { field: 'id', headerName: 'ID' },
              { field: 'company_id', headerName: 'Company' },
              { field: 'plan', headerName: 'Plan' },
              { field: 'amount', headerName: 'Amount', type: 'currency' },
              { field: 'current_period_end', headerName: 'Period End', type: 'date' },
              { field: 'status', headerName: 'Status', type: 'status' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12}>
        <DashboardCard title="Invoices" variant="outlined">
          <DataTable
            data={invoices}
            loading={loading}
            columns={[
              { field: 'id', headerName: 'ID' },
              { field: 'company_id', headerName: 'Company' },
              { field: 'status', headerName: 'Status', type: 'status' },
              { field: 'amount', headerName: 'Amount', type: 'currency' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
