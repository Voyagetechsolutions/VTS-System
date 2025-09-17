import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { Business as BusinessIcon, People as PeopleIcon, Announcement as AnnouncementIcon, MonetizationOn as MonetizationOnIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getPlatformMetrics, getActivityLog } from '../../../supabase/api';

export default function DevOverviewTab() {
  const [metrics, setMetrics] = useState({ companies: 0, users: 0, buses: 0, routes: 0, bookingsAll: 0, bookingsMonth: 0, revenueAll: 0 });
  const [activity, setActivity] = useState([]);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showManagePlans, setShowManagePlans] = useState(false);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showSendAnnouncement, setShowSendAnnouncement] = useState(false);

  useEffect(() => {
    (async () => {
      try { const m = await getPlatformMetrics(); if (m?.data) setMetrics(m.data); } catch {}
      try { const a = await getActivityLog(); setActivity(a.data || []); } catch {}
    })();
  }, []);

  const quickActions = [
    { 
      label: 'Create Company', 
      icon: <BusinessIcon />, 
      description: 'Add a new company to the platform',
      onClick: () => setShowCreateCompany(true),
      color: 'primary'
    },
    { 
      label: 'Manage Plans', 
      icon: <MonetizationOnIcon />, 
      description: 'Create and edit subscription plans',
      onClick: () => setShowManagePlans(true),
      color: 'success'
    },
    { 
      label: 'Manage Users', 
      icon: <PeopleIcon />, 
      description: 'Add, edit, or manage platform users',
      onClick: () => setShowManageUsers(true),
      color: 'info'
    },
    { 
      label: 'Send Announcement', 
      icon: <AnnouncementIcon />, 
      description: 'Send platform-wide notifications',
      onClick: () => setShowSendAnnouncement(true),
      color: 'warning'
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Platform Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="primary">{metrics.companies}</Typography>
              <Typography variant="body2" color="text.secondary">Active Companies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="secondary">{metrics.users}</Typography>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="success.main">{metrics.buses}</Typography>
              <Typography variant="body2" color="text.secondary">Active Buses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="warning.main">R{metrics.revenueAll?.toLocaleString() || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Management Actions */}
      <DashboardCard title="Quick Management Actions" variant="outlined" sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  '&:hover': { 
                    transform: 'translateY(-2px)', 
                    boxShadow: 3 
                  }
                }}
                onClick={action.onClick}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                    {action.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {action.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DashboardCard>

      {/* Recent Activity */}
      <DashboardCard title="Recent Activity" variant="outlined">
        <DataTable
          data={activity.slice(0, 10)}
          loading={false}
          columns={[
            { field: 'action', headerName: 'Action' },
            { field: 'user_name', headerName: 'User' },
            { field: 'created_at', headerName: 'Time', type: 'date' },
          ]}
          searchable={false}
          pagination={false}
        />
      </DashboardCard>

      {/* Modals will be added here */}
    </Box>
  );
}