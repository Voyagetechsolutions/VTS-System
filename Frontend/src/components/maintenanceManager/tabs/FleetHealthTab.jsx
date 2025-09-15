import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function FleetHealthTab() {
  const [fleet, setFleet] = useState([]);
  const [predictive, setPredictive] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: buses }, { data: alerts }] = await Promise.all([
      supabase.from('buses').select('bus_id, license_plate, status, mileage, last_service_at').eq('company_id', companyId),
      supabase.from('predictive_alerts').select('bus_id, alert_type, severity, created_at').eq('company_id', companyId),
    ]);
    setFleet(buses||[]); setPredictive(alerts||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Fleet Overview" variant="outlined">
          <DataTable data={fleet} columns={[{ field: 'license_plate', headerName: 'Plate' }, { field: 'status', headerName: 'Status' }, { field: 'mileage', headerName: 'Mileage' }, { field: 'last_service_at', headerName: 'Last Service', type: 'date' }]} searchable pagination />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Predictive Alerts" variant="outlined">
          <DataTable data={predictive} columns={[{ field: 'bus_id', headerName: 'Bus' }, { field: 'alert_type', headerName: 'Alert' }, { field: 'severity', headerName: 'Severity' }, { field: 'created_at', headerName: 'Date', type: 'date' }]} searchable pagination />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
