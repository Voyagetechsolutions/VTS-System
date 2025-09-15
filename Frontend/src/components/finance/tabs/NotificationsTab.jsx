import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { subscribeToIncidents } from '../../../supabase/realtime';

export default function NotificationsTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const add = (type, message) => setRows(prev => [{ created_at: new Date().toISOString(), type, message }, ...prev].slice(0, 200));
    const i = subscribeToIncidents(() => add('finance', 'Financial alert'));
    return () => { try { i.unsubscribe?.(); } catch {} };
  }, []);
  return (
    <DashboardCard title="Notifications & Alerts" variant="outlined">
      <DataTable data={rows} columns={[{ field: 'created_at', headerName: 'Time', type: 'date' }, { field: 'type', headerName: 'Type' }, { field: 'message', headerName: 'Message' }]} searchable pagination />
    </DashboardCard>
  );
}
