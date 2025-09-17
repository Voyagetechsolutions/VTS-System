import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Button, Box, Card, CardContent, List, ListItem, ListItemText, ListItemIcon, Chip, Alert, Stack, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsBusFilledIcon from '@mui/icons-material/DirectionsBusFilled';
import RouteIcon from '@mui/icons-material/Route';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PaidIcon from '@mui/icons-material/Paid';
import PercentIcon from '@mui/icons-material/Percent';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import { formatNumber, formatCurrency } from '../../../utils/formatters';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import LineChart from '../charts/LineChart';
import { getCompanyKPIs, getGlobalActivity, getSystemHealth, getTopRoutes, getBusiestDepots, getMaintenanceAlerts } from '../../../supabase/api';
import { supabase } from '../../../supabase/client';

// Company Admin Executive Control Center - Meta Dashboard
export default function OverviewTab() {
  const [kpis, setKpis] = useState({});
  const [activity, setActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [topRoutes, setTopRoutes] = useState([]);
  const [busiestDepots, setBusiestDepots] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [fatigue, setFatigue] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [kpisRes, activityRes, healthRes, routesRes, depotsRes, alertsRes] = await Promise.all([
          getCompanyKPIs(),
          getGlobalActivity(),
          getSystemHealth(),
          getTopRoutes(),
          getBusiestDepots(),
          getMaintenanceAlerts()
        ]);
        
        setKpis(kpisRes.data || {});
        setActivity(activityRes.data || []);
        setSystemHealth(healthRes.data || {});
        setTopRoutes(routesRes.data || []);
        setBusiestDepots(depotsRes.data || []);
        setMaintenanceAlerts(alertsRes.data || []);
      } catch (error) {
        console.error('Failed to load overview data:', error);
      }
    };
    
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const since = new Date(Date.now() - 24*3600*1000).toISOString();
        const { data } = await supabase
          .from('trips_with_details')
          .select('driver_id, departure_time, arrival_time')
          .gte('departure_time', since)
          .order('departure_time', { ascending: true });
        const byDriver = {};
        (data||[]).forEach(t => { (byDriver[t.driver_id] ||= []).push(t); });
        const issues = [];
        Object.entries(byDriver).forEach(([driver, list]) => {
          let totalMinutes = 0; let restIssue = false;
          for (let i=0;i<list.length;i++) {
            const s = new Date(list[i].departure_time).getTime();
            const e = new Date(list[i].arrival_time).getTime();
            totalMinutes += Math.max(0, Math.round((e - s)/60000));
            if (i>0) {
              const prevEnd = new Date(list[i-1].arrival_time).getTime();
              const restHours = (s - prevEnd)/3600000;
              if (restHours < 8) restIssue = true;
            }
          }
          if (totalMinutes > 600 || restIssue) issues.push({ driver_id: driver, total_minutes: totalMinutes, rest_issue: restIssue });
        });
        setFatigue(issues);
      } catch {}
    })();
  }, []);

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon />;
      case 'warning': return <WarningIcon />;
      case 'critical': return <ErrorIcon />;
      default: return <SecurityIcon />;
    }
  };

  return (
    <Box>
      {/* Executive KPIs */}
      <Typography variant="h4" gutterBottom>Executive Control Center</Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Total Revenue</Typography>
              <PaidIcon color="primary" />
            </Box>
            <Typography variant="h4" color="primary">{formatCurrency(kpis.revenue || 0)}</Typography>
            <Typography variant="caption" color="text.secondary">This Month</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Active Trips</Typography>
              <RouteIcon color="success" />
            </Box>
            <Typography variant="h4" color="success.main">{formatNumber(kpis.activeTrips || 0)}</Typography>
            <Typography variant="caption" color="text.secondary">Today</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Passengers</Typography>
              <PeopleIcon color="info" />
            </Box>
            <Typography variant="h4" color="info.main">{formatNumber(kpis.passengers || 0)}</Typography>
            <Typography variant="caption" color="text.secondary">Today</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Staff</Typography>
              <PeopleIcon color="secondary" />
            </Box>
            <Typography variant="h4" color="secondary.main">{formatNumber(kpis.staff || 0)}</Typography>
            <Typography variant="caption" color="text.secondary">Active</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Fleet Health</Typography>
              <DirectionsBusFilledIcon color="warning" />
            </Box>
            <Typography variant="h4" color="warning.main">{formatNumber(kpis.fleetHealth || 0)}%</Typography>
            <Typography variant="caption" color="text.secondary">Operational</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Bookings</Typography>
              <ConfirmationNumberIcon color="primary" />
            </Box>
            <Typography variant="h4" color="primary">{formatNumber(kpis.bookings || 0)}</Typography>
            <Typography variant="caption" color="text.secondary">This Month</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Insights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Performing Routes
              </Typography>
              <List dense>
                {topRoutes.slice(0, 5).map((route, index) => (
                  <ListItem key={route.route_id}>
                    <ListItemIcon>
                      <Chip label={index + 1} size="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={route.route_name}
                      secondary={`${formatCurrency(route.revenue)} • ${formatNumber(route.passengers)} passengers`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Busiest Depots */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DirectionsBusFilledIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Busiest Depots
              </Typography>
              <List dense>
                {busiestDepots.slice(0, 5).map((depot, index) => (
                  <ListItem key={depot.branch_id}>
                    <ListItemIcon>
                      <Chip label={index + 1} size="small" color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={depot.branch_name}
                      secondary={`${formatNumber(depot.trips)} trips • ${formatNumber(depot.passengers)} passengers`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                System Health
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>API Uptime</Typography>
                  <Chip 
                    icon={getHealthIcon(systemHealth.apiStatus)} 
                    label={`${systemHealth.apiUptime || 99.9}%`}
                    color={getHealthColor(systemHealth.apiStatus)}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Depot Activity</Typography>
                  <Chip 
                    icon={getHealthIcon(systemHealth.depotStatus)} 
                    label={`${systemHealth.activeDepots || 0}/${systemHealth.totalDepots || 0} Active`}
                    color={getHealthColor(systemHealth.depotStatus)}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Booking Office</Typography>
                  <Chip 
                    icon={getHealthIcon(systemHealth.bookingStatus)} 
                    label={`${systemHealth.activeBookingOffices || 0}/${systemHealth.totalBookingOffices || 0} Online`}
                    color={getHealthColor(systemHealth.bookingStatus)}
                    size="small"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Maintenance Alerts
              </Typography>
              {maintenanceAlerts.length === 0 ? (
                <Alert severity="success">No critical maintenance alerts</Alert>
              ) : (
                <List dense>
                  {maintenanceAlerts.slice(0, 5).map((alert) => (
                    <ListItem key={alert.alert_id}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.bus_number}
                        secondary={`${alert.issue_type} - ${alert.priority}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Global Activity Feed */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Global Activity Feed
              </Typography>
              <List dense>
                {activity.slice(0, 10).map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {item.type === 'booking' && <ConfirmationNumberIcon />}
                      {item.type === 'refund' && <PaidIcon />}
                      {item.type === 'incident' && <WarningIcon />}
                      {item.type === 'login' && <SecurityIcon />}
                      {item.type === 'maintenance' && <DirectionsBusFilledIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.description}
                      secondary={`${item.user_name} • ${new Date(item.created_at).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fatigue Alerts */}
      <Box mt={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Fatigue Alerts
            </Typography>
            {(fatigue || []).length === 0 ? (
              <Alert severity="success">No fatigue risks detected</Alert>
            ) : (
              <List dense>
                {(fatigue || []).map((f, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                    <ListItemText primary={`Driver ${f.driver_id}: ${Math.round(f.total_minutes/60)}h in last 24h${f.rest_issue ? ', insufficient rest' : ''}`} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions - updated per spec */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button variant="contained" color="secondary" startIcon={<DirectionsBusFilledIcon />} onClick={() => window.dispatchEvent(new CustomEvent('open-add-bus-to-route'))}>
            Add Bus to Route
          </Button>
          <Button variant="contained" color="success" startIcon={<RouteIcon />} onClick={() => window.dispatchEvent(new CustomEvent('open-add-route'))}>
            Add Route
          </Button>
          <Button variant="contained" color="primary" startIcon={<PeopleIcon />} onClick={() => window.dispatchEvent(new CustomEvent('open-assign-driver'))}>
            Assign Driver
          </Button>
          <Button variant="contained" color="warning" startIcon={<PaidIcon />} onClick={() => window.location.assign('#/admin/refunds')}>
            Pending Refunds
          </Button>
        </Stack>
      </Box>

      {/* Charts */}
      <Box mt={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Revenue Trend</Typography>
            <LineChart data={kpis.revenueTrend || []} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Booking Trends</Typography>
            <BarChart data={kpis.bookingsTrend || []} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
