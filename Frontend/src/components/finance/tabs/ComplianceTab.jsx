import React from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';

export default function ComplianceTab() {
  const templates = [
    { name: 'IFRS Profit & Loss', type: 'IFRS', status: 'Available' },
    { name: 'GAAP Balance Sheet', type: 'GAAP', status: 'Available' },
    { name: 'VAT/Sales Tax Report', type: 'Tax', status: 'Available' },
  ];
  return (
    <DashboardCard title="Compliance Templates & Security" variant="outlined">
      <DataTable data={templates} columns={[{ field: 'name', headerName: 'Template' }, { field: 'type', headerName: 'Type' }, { field: 'status', headerName: 'Status' }]} pagination={false} />
    </DashboardCard>
  );
}


