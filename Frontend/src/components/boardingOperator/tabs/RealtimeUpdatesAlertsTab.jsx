import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { subscribeToTrips, subscribeToIncidents } from '../../../supabase/realtime';

export default function RealtimeUpdatesAlertsTab() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const add = (a) => setAlerts(prev => [{ created_at: new Date().toISOString(), ...a }, ...prev].slice(0, 200));
    const tripsSub = subscribeToTrips(() => add({ type: 'trip_update', message: 'Trip updated' }));
    const incSub = subscribeToIncidents(() => add({ type: 'incident', message: 'New incident reported' }));
    return () => { try { tripsSub.unsubscribe?.(); incSub.unsubscribe?.(); } catch {} };
  }, []);
  return (
    <DashboardCard title="Realtime Updates & Alerts" variant="outlined">
      <DataTable
        data={alerts}
        columns={[
          { field: 'created_at', headerName: 'Time', type: 'date' },
          { field: 'type', headerName: 'Type' },
          { field: 'message', headerName: 'Message' },
        ]}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
