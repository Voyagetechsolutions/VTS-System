import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { subscribeToIncidents, subscribeToTrips } from '../../../supabase/realtime';

export default function NotificationsTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const add = (type, message) => setRows(prev => [{ created_at: new Date().toISOString(), type, message }, ...prev].slice(0, 200));
    const t = subscribeToTrips(() => add('trip', 'Trip updated'));
    const i = subscribeToIncidents(() => add('incident', 'Incident reported'));
    return () => { try { t.unsubscribe?.(); i.unsubscribe?.(); } catch {} };
  }, []);
  return (
    <DashboardCard title="Notifications & Alerts" variant="outlined">
      <DataTable data={rows} columns={[{ field: 'created_at', headerName: 'Time', type: 'date' }, { field: 'type', headerName: 'Type' }, { field: 'message', headerName: 'Message' }]} searchable pagination />
    </DashboardCard>
  );
}
