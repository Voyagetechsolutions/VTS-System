import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert, Tabs, Tab
} from '@mui/material';
import {
  Notifications as NotificationsIcon, Warning as AlertIcon,
  Error as IncidentIcon, Message as MessageIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import ActivityAlertsTable from '../components/ActivityAlertsTable';
import OpenIncidentsTable from '../components/OpenIncidentsTable';
import MessagesTable from '../components/MessagesTable';

export default function NotificationsHubTab() {
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    status: '',
    priority: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    openAlerts: 0,
    openIncidents: 0,
    unreadMessages: 0,
    totalNotifications: 0
  });

  const loadAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }, [companyId]);

  const loadIncidents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          reporter:reported_by(name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error loading incidents:', error);
    }
  }, [companyId]);

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(name, email),
          recipient:recipient_id(name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: openAlerts },
        { count: openIncidents },
        { count: unreadMessages }
      ] = await Promise.all([
        supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'open'),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'open'),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'unread')
      ]);

      const totalNotifications = (openAlerts || 0) + (openIncidents || 0) + (unreadMessages || 0);

      setMetrics({
        openAlerts: openAlerts || 0,
        openIncidents: openIncidents || 0,
        unreadMessages: unreadMessages || 0,
        totalNotifications
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAlerts(),
        loadIncidents(),
        loadMessages(),
        loadMetrics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadAlerts, loadIncidents, loadMessages, loadMetrics]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.created_at).toISOString().split('T')[0];
    return (
      (!filters.startDate || alertDate >= filters.startDate) &&
      (!filters.endDate || alertDate <= filters.endDate) &&
      (!filters.type || alert.type === filters.type) &&
      (!filters.status || alert.status === filters.status)
    );
  });

  const filteredIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.created_at).toISOString().split('T')[0];
    return (
      (!filters.startDate || incidentDate >= filters.startDate) &&
      (!filters.endDate || incidentDate <= filters.endDate) &&
      (!filters.type || incident.type === filters.type) &&
      (!filters.status || incident.status === filters.status) &&
      (!filters.priority || incident.priority === filters.priority)
    );
  });

  const filteredMessages = messages.filter(message => {
    const messageDate = new Date(message.created_at).toISOString().split('T')[0];
    return (
      (!filters.startDate || messageDate >= filters.startDate) &&
      (!filters.endDate || messageDate <= filters.endDate) &&
      (!filters.status || message.status === filters.status)
    );
  });

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notifications & Alerts
        </Typography>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <NotificationsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalNotifications}</Typography>
              <Typography variant="body2" color="text.secondary">Total Notifications</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AlertIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.openAlerts}</Typography>
              <Typography variant="body2" color="text.secondary">Open Alerts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <IncidentIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.openIncidents}</Typography>
              <Typography variant="body2" color="text.secondary">Open Incidents</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MessageIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.unreadMessages}</Typography>
              <Typography variant="body2" color="text.secondary">Unread Messages</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="booking">Booking</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="trip">Trip</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="breakdown">Breakdown</MenuItem>
                  <MenuItem value="delay">Delay</MenuItem>
                  <MenuItem value="staff_issue">Staff Issue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="unread">Unread</MenuItem>
                  <MenuItem value="read">Read</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for different notification types */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Activity Alerts (${filteredAlerts.length})`} />
            <Tab label={`Open Incidents (${filteredIncidents.length})`} />
            <Tab label={`Messages (${filteredMessages.length})`} />
          </Tabs>

          {tabValue === 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>Activity Alerts</Typography>
              {filteredAlerts.length === 0 ? (
                <Alert severity="info">
                  No activity alerts found.
                </Alert>
              ) : (
                <ActivityAlertsTable 
                  alerts={filteredAlerts} 
                  loading={loading}
                  onUpdate={loadAlerts}
                />
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>Open Incidents</Typography>
              {filteredIncidents.length === 0 ? (
                <Alert severity="info">
                  No open incidents found.
                </Alert>
              ) : (
                <OpenIncidentsTable 
                  incidents={filteredIncidents} 
                  loading={loading}
                  onUpdate={loadIncidents}
                />
              )}
            </>
          )}

          {tabValue === 2 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>Messages</Typography>
              {filteredMessages.length === 0 ? (
                <Alert severity="info">
                  No messages found.
                </Alert>
              ) : (
                <MessagesTable 
                  messages={filteredMessages} 
                  loading={loading}
                  onUpdate={loadMessages}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
