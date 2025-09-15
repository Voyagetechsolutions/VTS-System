import React from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';

export default function IntegrationsTab() {
  const gateways = [
    { name: 'Stripe', status: 'connected' },
    { name: 'PayPal', status: 'disconnected' },
    { name: 'Paystack', status: 'connected' },
    { name: 'Flutterwave', status: 'connected' },
  ];
  const accounting = [
    { name: 'QuickBooks', status: 'connected' },
    { name: 'Xero', status: 'disconnected' },
    { name: 'Sage', status: 'disconnected' },
  ];
  const banking = [
    { name: 'Bank Reconciliation', status: 'connected' },
  ];
  return (
    <>
      <DashboardCard title="Payment Gateways" variant="outlined">
        <DataTable data={gateways} columns={[{ field: 'name', headerName: 'Provider' }, { field: 'status', headerName: 'Status' }]} pagination={false} />
      </DashboardCard>
      <DashboardCard title="Accounting Systems" variant="outlined">
        <DataTable data={accounting} columns={[{ field: 'name', headerName: 'System' }, { field: 'status', headerName: 'Status' }]} pagination={false} />
      </DashboardCard>
      <DashboardCard title="Banking" variant="outlined">
        <DataTable data={banking} columns={[{ field: 'name', headerName: 'Integration' }, { field: 'status', headerName: 'Status' }]} pagination={false} />
      </DashboardCard>
    </>
  );
}


