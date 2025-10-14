import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';

export default function NotificationsTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    setTimeout(() => {
      setRows([{ created_at: new Date().toISOString(), type: 'hr', message: 'Example HR alert' }]);
    }, 0);
  }, []);
  return (
    <DashboardCard title="Notifications & Alerts" variant="outlined">
      <DataTable data={rows} columns={[{ field: 'created_at', headerName: 'Time', type: 'date' }, { field: 'type', headerName: 'Type' }, { field: 'message', headerName: 'Message' }]} searchable pagination />
    </DashboardCard>
  );
}
