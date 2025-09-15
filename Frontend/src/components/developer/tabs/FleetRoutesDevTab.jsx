import React, { useEffect, useState } from 'react';
import { Grid, Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getAllBusesGlobal, getAllRoutesGlobal } from '../../../supabase/api';
import { ModernTextField, ModernButton } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function FleetRoutesDevTab() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busPlate, setBusPlate] = useState('');
  const [busStatus, setBusStatus] = useState('');
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');

  const load = async () => {
    setLoading(true);
    const [b, r] = await Promise.all([getAllBusesGlobal(), getAllRoutesGlobal()]);
    setBuses(b.data || []);
    setRoutes(r.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredBuses = buses.filter(b => (
    ((busPlate || '').trim() === '' ? true : (b.license_plate || '').toLowerCase().includes(busPlate.toLowerCase())) &&
    ((busStatus || '').trim() === '' ? true : (b.status || '').toLowerCase().includes(busStatus.toLowerCase()))
  ));
  const filteredRoutes = routes.filter(r => (
    ((routeOrigin || '').trim() === '' ? true : (r.origin || '').toLowerCase().includes(routeOrigin.toLowerCase())) &&
    ((routeDestination || '').trim() === '' ? true : (r.destination || '').toLowerCase().includes(routeDestination.toLowerCase()))
  ));

  const exportBuses = () => {
    if (!filteredBuses.length) return;
    const csv = toCSV(filteredBuses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportRoutes = () => {
    if (!filteredRoutes.length) return;
    const csv = toCSV(filteredRoutes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'routes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Buses" variant="outlined" headerAction={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <ModernTextField label="Search Plate" value={busPlate} onChange={e => setBusPlate(e.target.value)} />
            <ModernTextField label="Search Status" value={busStatus} onChange={e => setBusStatus(e.target.value)} />
            <ModernButton variant="outlined" icon="download" onClick={exportBuses}>Export CSV</ModernButton>
          </Box>
        }>
          <DataTable
            data={filteredBuses}
            loading={loading}
            columns={[
              { field: 'license_plate', headerName: 'Plate', sortable: true },
              { field: 'capacity', headerName: 'Capacity' },
              { field: 'status', headerName: 'Status', type: 'status' },
              { field: 'company_id', headerName: 'Company' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Routes" variant="outlined" headerAction={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <ModernTextField label="Search Origin" value={routeOrigin} onChange={e => setRouteOrigin(e.target.value)} />
            <ModernTextField label="Search Destination" value={routeDestination} onChange={e => setRouteDestination(e.target.value)} />
            <ModernButton variant="outlined" icon="download" onClick={exportRoutes}>Export CSV</ModernButton>
          </Box>
        }>
          <DataTable
            data={filteredRoutes}
            loading={loading}
            columns={[
              { field: 'origin', headerName: 'Origin', sortable: true },
              { field: 'destination', headerName: 'Destination', sortable: true },
              { field: 'country', headerName: 'Country' },
              { field: 'frequency', headerName: 'Frequency' },
              { field: 'company_id', headerName: 'Company' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
