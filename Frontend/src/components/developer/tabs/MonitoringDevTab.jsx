import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert, IconButton, Tooltip, Tabs, Tab, LinearProgress } from '@mui/material';
import { Visibility as ViewIcon, Flag as FlagIcon, Send as SendIcon, Assessment as AssessmentIcon, Download as DownloadIcon, Delete as DeleteIcon, Security as SecurityIcon, Error as ErrorIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon, Business as BusinessIcon, Person as PersonIcon, DirectionsBus as BusIcon, Receipt as ReceiptIcon, Route as RouteIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getActivityLogGlobal, getCompaniesLight, getSystemMetrics } from '../../../supabase/api';
import { ModernTextField, ModernButton } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function MonitoringDevTab() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // Filter states
  const [logSearch, setLogSearch] = useState('');
  const [logCompany, setLogCompany] = useState('');
  const [logModule, setLogModule] = useState('');
  const [logStatus, setLogStatus] = useState('');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  
  // Modal states
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // System monitoring states
  const [systemMetrics, setSystemMetrics] = useState({
    activeCompanies: 0,
    activeBuses: 0,
    bookingsToday: 0,
    transactionsToday: 0,
    errorsToday: 0,
    systemUptime: 99.9,
    avgResponseTime: 150,
    failedLogins: 0
  });

  const load = async () => {
    setLoading(true);
    try {
      const [activityRes, companiesRes, metricsRes] = await Promise.all([
        getActivityLogGlobal(),
        getCompaniesLight(),
        getSystemMetrics()
      ]);
      
      setActivityLogs(activityRes.data || []);
      setCompanies(companiesRes.data || []);
      setSystemMetrics(metricsRes.data || {
        activeCompanies: 0,
        activeBuses: 0,
        bookingsToday: 0,
        transactionsToday: 0,
        errorsToday: 0,
        systemUptime: 0,
        avgResponseTime: 0,
        failedLogins: 0
      });
      
      // Error logs can be filtered from activity logs
      setErrorLogs([]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);

  const filteredActivityLogs = activityLogs.filter(log => (
    (logSearch ? 
      (log.message || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.type || '').toLowerCase().includes(logSearch.toLowerCase())
      : true) &&
    (logCompany ? log.company_id === logCompany : true) &&
    (logModule ? (log.type || '').toLowerCase().includes(logModule.toLowerCase()) : true) &&
    (logDateFrom ? new Date(log.created_at) >= new Date(logDateFrom) : true) &&
    (logDateTo ? new Date(log.created_at) <= new Date(logDateTo) : true)
  ));

  const filteredErrorLogs = errorLogs.filter(log => (
    (logSearch ? 
      log.error.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.module.toLowerCase().includes(logSearch.toLowerCase())
      : true) &&
    (logModule ? log.module === logModule : true) &&
    (logDateFrom ? new Date(log.timestamp) >= new Date(logDateFrom) : true) &&
    (logDateTo ? new Date(log.timestamp) <= new Date(logDateTo) : true)
  ));

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  const handleFlagSuspicious = (log) => {
    setSelectedLog(log);
    setShowFlagModal(true);
  };

  const handleSendAlert = (log) => {
    setSelectedLog(log);
    setShowAlertModal(true);
  };

  const handleClearLogs = async () => {
    try {
      // TODO: Implement clear logs functionality
      console.log('Clearing logs...');
      load();
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'suspicious': return 'warning';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getModuleIcon = (module) => {
    switch (module?.toLowerCase()) {
      case 'buses': return <BusIcon />;
      case 'routes': return <RouteIcon />;
      case 'bookings': return <ReceiptIcon />;
      case 'transactions': return <ReceiptIcon />;
      case 'login': return <SecurityIcon />;
      default: return <AssessmentIcon />;
    }
  };

  const activityActions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewLog(row),
      color: 'primary'
    },
    { 
      label: 'Flag Suspicious', 
      icon: <FlagIcon />, 
      onClick: ({ row }) => handleFlagSuspicious(row),
      color: 'warning'
    },
    { 
      label: 'Send Alert', 
      icon: <SendIcon />, 
      onClick: ({ row }) => handleSendAlert(row),
      color: 'info'
    },
  ];

  const errorActions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewLog(row),
      color: 'primary'
    },
    { 
      label: 'Flag for Review', 
      icon: <FlagIcon />, 
      onClick: ({ row }) => handleFlagSuspicious(row),
      color: 'warning'
    },
  ];

  const exportLogs = () => {
    const logsToExport = activeTab === 0 ? filteredActivityLogs : filteredErrorLogs;
    if (!logsToExport.length) return;
    const csv = toCSV(logsToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab === 0 ? 'activity' : 'error'}_logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Monitoring & Logs
      </Typography>
      
      {/* System Monitoring Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="success.main">{systemMetrics.activeCompanies}</Typography>
              <Typography variant="body2" color="text.secondary">Active Companies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="primary">{systemMetrics.activeBuses}</Typography>
              <Typography variant="body2" color="text.secondary">Active Buses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="info.main">{systemMetrics.bookingsToday.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Bookings Today</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="success.main">R{systemMetrics.transactionsToday.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Transactions Today</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Logs Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Activity Logs" />
            <Tab label="Error & Security Logs" />
          </Tabs>
        </Box>

        {/* Activity Logs Tab */}
        {activeTab === 0 && (
          <CardContent>
            <DataTable
              data={filteredActivityLogs}
              loading={loading}
              columns={[
                { 
                  field: 'created_at', 
                  headerName: 'Timestamp', 
                  type: 'date', 
                  sortable: true,
                  renderCell: (params) => (
                    <Typography variant="body2">
                      {new Date(params.value).toLocaleString()}
                    </Typography>
                  )
                },
                { 
                  field: 'type', 
                  headerName: 'Action',
                  renderCell: (params) => (
                    <Typography variant="body2">
                      {params.value}
                    </Typography>
                  )
                },
                { 
                  field: 'message', 
                  headerName: 'Details',
                  renderCell: (params) => (
                    <Typography variant="body2">
                      {params.value}
                    </Typography>
                  )
                },
              ]}
              rowActions={activityActions}
              searchable
              pagination
            />
          </CardContent>
        )}

        {/* Error & Security Logs Tab */}
        {activeTab === 1 && (
          <CardContent>
            <DataTable
              data={filteredErrorLogs}
              loading={loading}
              columns={[
                { 
                  field: 'timestamp', 
                  headerName: 'Timestamp', 
                  type: 'date', 
                  sortable: true,
                  renderCell: (params) => (
                    <Typography variant="body2">
                      {new Date(params.value).toLocaleString()}
                    </Typography>
                  )
                },
                { 
                  field: 'severity', 
                  headerName: 'Severity',
                  renderCell: (params) => (
                    <Chip 
                      label={params.value} 
                      color={getSeverityColor(params.value)}
                      size="small"
                    />
                  )
                },
                { 
                  field: 'error', 
                  headerName: 'Error / Event',
                  renderCell: (params) => (
                    <Typography variant="body2">
                      {params.value}
                    </Typography>
                  )
                },
                { 
                  field: 'actionTaken', 
                  headerName: 'Action Taken',
                  renderCell: (params) => (
                    <Typography variant="body2" color="text.secondary">
                      {params.value}
                    </Typography>
                  )
                },
              ]}
              rowActions={errorActions}
              searchable
              pagination
            />
          </CardContent>
        )}
      </Card>
    </Box>
  );
}
