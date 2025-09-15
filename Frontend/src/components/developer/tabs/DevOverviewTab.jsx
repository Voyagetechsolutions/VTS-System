import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { DashboardGrid, GridItem, DashboardSection } from '../../common/DashboardGrid';
import DashboardCard, { StatsCard, QuickActionCard, AlertCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getPlatformMetrics, getGrowthTrends, getActivityLog } from '../../../supabase/api';

export default function DevOverviewTab() {
  const [metrics, setMetrics] = useState({ companies: 0, users: 0, buses: 0, routes: 0, bookingsAll: 0, bookingsMonth: 0, revenueAll: 0 });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    (async () => {
      try { const m = await getPlatformMetrics(); if (m?.data) setMetrics(m.data); } catch {}
      try { const a = await getActivityLog(); setActivity(a.data || []); } catch {}
    })();
  }, []);

  const quickActions = [
    { label: 'Create Company', icon: 'add', onClick: () => window.location.assign('#/dev/create-company') },
    { label: 'Manage Plans', icon: 'revenue', onClick: () => window.location.assign('#/dev/plans') },
    { label: 'Manage Users', icon: 'users', onClick: () => window.location.assign('#/dev/users') },
    { label: 'Send Announcement', icon: 'announcements', onClick: () => window.location.assign('#/dev/announce') },
  ];

  return (
    <DashboardGrid>
      <GridItem xs={12}>
        <DashboardSection title="Platform Metrics" subtitle="High-level stats across all companies">
          <GridItem xs={12} sm={6} md={3}><StatsCard title="Total Companies" value={metrics.companies} icon="business" color="primary" /></GridItem>
          <GridItem xs={12} sm={6} md={3}><StatsCard title="Total Users" value={metrics.users} icon="users" color="info" /></GridItem>
          <GridItem xs={12} sm={6} md={3}><StatsCard title="Total Buses" value={metrics.buses} icon="bus" color="success" /></GridItem>
          <GridItem xs={12} sm={6} md={3}><StatsCard title="Total Routes" value={metrics.routes} icon="route" color="warning" /></GridItem>
          <GridItem xs={12} sm={6} md={3}><StatsCard title="Bookings (All)" value={metrics.bookingsAll} icon="bookings" color="primary" /></GridItem>
          <GridItem xs={12} sm={6} md={3}><StatsCard title="Bookings (Month)" value={metrics.bookingsMonth} icon="bookings" color="info" /></GridItem>
          <GridItem xs={12} sm={6} md={3}><StatsCard title="Revenue (All)" value={`$${Number(metrics.revenueAll||0).toLocaleString()}`} icon="revenue" color="success" /></GridItem>
        </DashboardSection>
      </GridItem>

      <GridItem xs={12} md={4}>
        <QuickActionCard title="Quick Management Actions" actions={quickActions} />
      </GridItem>

      <GridItem xs={12} md={8}>
        <DashboardCard title="Recent Activity" variant="outlined">
          <DataTable
            data={activity}
            columns={[
              { field: 'created_at', headerName: 'When', type: 'date' },
              { field: 'type', headerName: 'Type' },
              { field: 'message', headerName: 'Message' },
            ]}
            pagination
            searchable
            searchPlaceholder="Search activity..."
          />
        </DashboardCard>
      </GridItem>

      <GridItem xs={12}>
        <DashboardSection title="System Health & Alerts">
          <GridItem xs={12} md={4}><AlertCard type="warning" title="Pending Verifications" message="3 companies pending verification" /></GridItem>
          <GridItem xs={12} md={4}><AlertCard type="error" title="Failed API Calls" message="2 edge function failures detected" /></GridItem>
          <GridItem xs={12} md={4}><AlertCard type="info" title="Security Alerts" message="1 suspicious login attempt" /></GridItem>
        </DashboardSection>
      </GridItem>
    </DashboardGrid>
  );
}
