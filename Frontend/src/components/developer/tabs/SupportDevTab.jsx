import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listSupportTicketsGlobal, assignSupportTicket } from '../../../supabase/api';

export default function SupportDevTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await listSupportTicketsGlobal();
    setRows(res.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const actions = [
    { label: 'Assign to me', icon: 'user', onClick: async ({ row }) => { await assignSupportTicket(row.id, window.userId); load(); } },
  ];

  return (
    <DashboardCard title="Support & Helpdesk" variant="outlined">
      <DataTable
        data={rows}
        loading={loading}
        columns={[
          { field: 'created_at', headerName: 'Created', type: 'date' },
          { field: 'title', headerName: 'Title' },
          { field: 'message', headerName: 'Message' },
          { field: 'priority', headerName: 'Priority' },
          { field: 'status', headerName: 'Status', type: 'status' },
          { field: 'company_id', headerName: 'Company' },
        ]}
        rowActions={actions.map(a => ({ ...a, onClick: (row) => a.onClick({ row }) }))}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
