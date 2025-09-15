import React, { useEffect, useState } from 'react';
import { Grid, Box } from '@mui/material';
import DashboardCard, { StatsCard, QuickActionCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getCompanyDashboardKPIs, getCompanyAlertsFeed } from '../../../supabase/api';
import CommandCenterMap from './CommandCenterMap';

export default function CommandCenterTab() {
  const [kpis, setKpis] = useState({ activeTrips: 0, passengersToday: 0, revenueToday: 0, incidentsOpen: 0 });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    (async () => {
      try { const r = await getCompanyDashboardKPIs(); if (r?.data) setKpis(r.data); } catch {}
      try { const a = await getCompanyAlertsFeed(); setAlerts(a.data || []); } catch {}
    })();
  }, []);

  const actions = [
    { label: 'Add Trip', icon: 'add', onClick: () => window.location.assign('#/admin/trips/new') },
    { label: 'Assign Driver', icon: 'driver', onClick: () => window.location.assign('#/admin/drivers') },
    { label: 'Issue Refund', icon: 'money', onClick: () => window.location.assign('#/admin/refunds') },
    { label: 'Broadcast', icon: 'announcements', onClick: () => window.location.assign('#/admin/broadcast') },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DashboardCard title="Live Map" variant="elevated">
          <CommandCenterMap />
        </DashboardCard>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Active Trips" value={kpis.activeTrips} icon="trips" color="info" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Passengers Today" value={kpis.passengersToday} icon="passengers" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Revenue Today" value={`$${Number(kpis.revenueToday||0).toLocaleString()}`} icon="revenue" color="success" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Open Incidents" value={kpis.incidentsOpen} icon="incident" color="warning" /></Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4}>
        <QuickActionCard title="Quick Actions" actions={actions} />
      </Grid>
      <Grid item xs={12} md={8}>
        <DashboardCard title="Alerts & Activity" variant="outlined">
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
      </Grid>
    </Grid>
  );
}
