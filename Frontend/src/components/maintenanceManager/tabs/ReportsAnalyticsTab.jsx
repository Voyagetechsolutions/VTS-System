import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  GetApp as ExportIcon,
  FilterList as FilterIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalGasStation as FuelIcon,
  Recycling as RecycleIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import DataTable from '../../common/DataTable';

export default function ReportsAnalyticsTab() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data states
  const [tasks, setTasks] = useState([]);
  const [downtime, setDowntime] = useState([]);
  const [inventoryUsage, setInventoryUsage] = useState([]);
  const [carbonLog, setCarbonLog] = useState([]);
  const [recycling, setRecycling] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Get company ID from user context
  const companyId = 'your-company-id'; // Replace with actual company ID

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTasks(),
        fetchDowntime(),
        fetchInventoryUsage(),
        fetchCarbonLog(),
        fetchRecycling(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Error fetching data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          buses:bus_id (plate_number, name),
          users:assigned_to (name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchDowntime = async () => {
    try {
      const { data, error } = await supabase
        .from('downtime_logs')
        .select(`
          *,
          buses:bus_id (plate_number, name)
        `)
        .eq('company_id', companyId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setDowntime(data || []);
    } catch (error) {
      console.error('Error fetching downtime:', error);
    }
  };

  const fetchInventoryUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_usage')
        .select(`
          *,
          buses:bus_id (plate_number, name),
          users:staff_id (name, email)
        `)
        .eq('company_id', companyId)
        .order('used_at', { ascending: false });

      if (error) throw error;
      setInventoryUsage(data || []);
    } catch (error) {
      console.error('Error fetching inventory usage:', error);
    }
  };

  const fetchCarbonLog = async () => {
    try {
      const { data, error } = await supabase
        .from('carbon_logs')
        .select(`
          *,
          buses:bus_id (plate_number, name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarbonLog(data || []);
    } catch (error) {
      console.error('Error fetching carbon logs:', error);
    }
  };

  const fetchRecycling = async () => {
    try {
      const { data, error } = await supabase
        .from('recycling_logs')
        .select(`
          *,
          buses:bus_id (plate_number, name),
          users:staff_id (name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecycling(data || []);
    } catch (error) {
      console.error('Error fetching recycling logs:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          users:target_user (name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleExport = async (type, format) => {
    try {
      // Implement export logic based on type and format
      setSnackbar({ open: true, message: `Exporting ${type} as ${format}...`, severity: 'info' });
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({ open: true, message: 'Error exporting data', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const tabPanels = [
    {
      label: 'Tasks',
      icon: <AssessmentIcon />,
      content: (
        <DataTable
          data={tasks}
          loading={loading}
          columns={[
            { 
              field: 'id', 
              headerName: 'Task ID',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium" color="primary">
                  #{params.value}
                </Typography>
              )
            },
            { 
              field: 'busPlate', 
              headerName: 'Bus',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.row.buses?.plate_number || 'N/A'}
                </Typography>
              )
            },
            { 
              field: 'task_type', 
              headerName: 'Task Type',
              renderCell: (params) => (
                <Chip label={params.value} size="small" color="info" />
              )
            },
            { 
              field: 'assigned_to', 
              headerName: 'Assigned To',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.row.users?.name || 'N/A'}
                </Typography>
              )
            },
            { 
              field: 'status', 
              headerName: 'Status',
              renderCell: (params) => (
                <Chip 
                  label={params.value} 
                  size="small" 
                  color={getStatusColor(params.value)}
                />
              )
            },
            { 
              field: 'created_at', 
              headerName: 'Created',
              renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                  {new Date(params.value).toLocaleDateString()}
                </Typography>
              )
            }
          ]}
          rowActions={[
            { label: 'Edit', icon: <AssessmentIcon />, onClick: ({ row }) => console.log('Edit', row) },
            { label: 'View Details', icon: <AssessmentIcon />, onClick: ({ row }) => console.log('View', row) }
          ]}
          searchable
          pagination
        />
      )
    },
    {
      label: 'Downtime',
      icon: <ScheduleIcon />,
      content: (
        <DataTable
          data={downtime}
          loading={loading}
          columns={[
            { 
              field: 'id', 
              headerName: 'Log ID',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium" color="primary">
                  #{params.value}
                </Typography>
              )
            },
            { 
              field: 'busPlate', 
              headerName: 'Bus',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.row.buses?.plate_number || 'N/A'}
                </Typography>
              )
            },
            { 
              field: 'reason', 
              headerName: 'Reason',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.value}
                </Typography>
              )
            },
            { 
              field: 'duration_hours', 
              headerName: 'Duration (hrs)',
              renderCell: (params) => (
                <Typography variant="body2" color="primary" fontWeight="medium">
                  {params.value}
                </Typography>
              )
            },
            { 
              field: 'start_time', 
              headerName: 'Start Time',
              renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                  {new Date(params.value).toLocaleString()}
                </Typography>
              )
            }
          ]}
          rowActions={[
            { label: 'Edit', icon: <ScheduleIcon />, onClick: ({ row }) => console.log('Edit', row) },
            { label: 'View Details', icon: <ScheduleIcon />, onClick: ({ row }) => console.log('View', row) }
          ]}
          searchable
          pagination
        />
      )
    },
    {
      label: 'Inventory Usage',
      icon: <AssessmentIcon />,
      content: (
        <DataTable
          data={inventoryUsage}
          loading={loading}
          columns={[
            { 
              field: 'id', 
              headerName: 'Usage ID',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium" color="primary">
                  #{params.value}
                </Typography>
              )
            },
            { 
              field: 'item', 
              headerName: 'Item',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium">
                  {params.value}
                </Typography>
              )
            },
            { 
              field: 'busPlate', 
              headerName: 'Bus',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.row.buses?.plate_number || 'N/A'}
                </Typography>
              )
            },
            { 
              field: 'quantity', 
              headerName: 'Quantity',
              renderCell: (params) => (
                <Typography variant="body2" color="primary" fontWeight="medium">
                  {params.value}
                </Typography>
              )
            },
            { 
              field: 'staffName', 
              headerName: 'Staff',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.row.users?.name || 'N/A'}
                </Typography>
              )
            },
            { 
              field: 'used_at', 
              headerName: 'Used At',
              renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                  {new Date(params.value).toLocaleDateString()}
                </Typography>
              )
            }
          ]}
          rowActions={[
            { label: 'Edit', icon: <AssessmentIcon />, onClick: ({ row }) => console.log('Edit', row) },
            { label: 'View Details', icon: <AssessmentIcon />, onClick: ({ row }) => console.log('View', row) }
          ]}
          searchable
          pagination
        />
      )
    },
    {
      label: 'Carbon Log',
      icon: <TrendingUpIcon />,
      content: (
        <DataTable
          data={carbonLog}
          loading={loading}
          columns={[
            { 
              field: 'id', 
              headerName: 'Log ID',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium" color="primary">
                  #{params.value}
                </Typography>
              )
            },
            { 
              field: 'busPlate', 
              headerName: 'Bus',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.row.buses?.plate_number || 'N/A'}
                </Typography>
              )
            },
            { 
              field: 'carbon_emission', 
              headerName: 'Carbon Emission',
              renderCell: (params) => (
                <Typography variant="body2" color="primary" fontWeight="medium">
                  {params.value} kg CO2
                </Typography>
              )
            },
            { 
              field: 'distance', 
              headerName: 'Distance',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.value} km
                </Typography>
              )
            },
            { 
              field: 'created_at', 
              headerName: 'Date',
              renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                  {new Date(params.value).toLocaleDateString()}
                </Typography>
              )
            }
          ]}
          rowActions={[
            { label: 'Edit', icon: <TrendingUpIcon />, onClick: ({ row }) => console.log('Edit', row) },
            { label: 'View Details', icon: <TrendingUpIcon />, onClick: ({ row }) => console.log('View', row) }
          ]}
          searchable
          pagination
        />
      )
    },
    {
      label: 'Recycling',
      icon: <RecycleIcon />,
      content: (
        <DataTable
          data={recycling}
          loading={loading}
          columns={[
            { 
              field: 'id', 
              headerName: 'Log ID',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium" color="primary">
                  #{params.value}
                </Typography>
              )
            },
            { 
              field: 'material', 
              headerName: 'Material',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium">
                  {params.value}
                </Typography>
              )
            },
            { 
              field: 'quantity', 
              headerName: 'Quantity',
              renderCell: (params) => (
                <Typography variant="body2" color="primary" fontWeight="medium">
                  {params.value}
                </Typography>
              )
            },
            { 
              field: 'staffName', 
              headerName: 'Staff',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.row.users?.name || 'N/A'}
                </Typography>
              )
            },
            { 
              field: 'created_at', 
              headerName: 'Date',
              renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                  {new Date(params.value).toLocaleDateString()}
                </Typography>
              )
            }
          ]}
          rowActions={[
            { label: 'Edit', icon: <RecycleIcon />, onClick: ({ row }) => console.log('Edit', row) },
            { label: 'View Details', icon: <RecycleIcon />, onClick: ({ row }) => console.log('View', row) }
          ]}
          searchable
          pagination
        />
      )
    },
    {
      label: 'Notifications',
      icon: <NotificationsIcon />,
      content: (
        <DataTable
          data={notifications}
          loading={loading}
          columns={[
            { 
              field: 'id', 
              headerName: 'Notification ID',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium" color="primary">
                  #{params.value}
                </Typography>
              )
            },
            { 
              field: 'title', 
              headerName: 'Title',
              renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium">
                  {params.value}
                </Typography>
              )
            },
            { 
              field: 'message', 
              headerName: 'Message',
              renderCell: (params) => (
                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {params.value}
                </Typography>
              )
            },
            { 
              field: 'target_user', 
              headerName: 'Target User',
              renderCell: (params) => (
                <Typography variant="body2">
                  {params.row.users?.name || 'N/A'}
                </Typography>
              )
            },
            { 
              field: 'status', 
              headerName: 'Status',
              renderCell: (params) => (
                <Chip 
                  label={params.value} 
                  size="small" 
                  color={params.value === 'sent' ? 'success' : params.value === 'pending' ? 'warning' : 'default'}
                />
              )
            },
            { 
              field: 'created_at', 
              headerName: 'Sent At',
              renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                  {new Date(params.value).toLocaleString()}
                </Typography>
              )
            }
          ]}
          rowActions={[
            { label: 'Edit', icon: <NotificationsIcon />, onClick: ({ row }) => console.log('Edit', row) },
            { label: 'View Details', icon: <NotificationsIcon />, onClick: ({ row }) => console.log('View', row) }
          ]}
          searchable
          pagination
        />
      )
    }
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => console.log('Advanced Filters')}
          >
            Advanced Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={() => setShowExportDialog(true)}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabPanels.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Card>
        <CardContent>
          {tabPanels[activeTab]?.content}
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        currentTab={tabPanels[activeTab]?.label}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Export Dialog
function ExportDialog({ open, onClose, onExport, currentTab }) {
  const [formData, setFormData] = useState({
    type: currentTab || 'Tasks',
    format: 'csv',
    dateRange: 'last30days'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport(formData.type, formData.format);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Report</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Report Type"
                >
                  <MenuItem value="Tasks">Tasks</MenuItem>
                  <MenuItem value="Downtime">Downtime</MenuItem>
                  <MenuItem value="Inventory Usage">Inventory Usage</MenuItem>
                  <MenuItem value="Carbon Log">Carbon Log</MenuItem>
                  <MenuItem value="Recycling">Recycling</MenuItem>
                  <MenuItem value="Notifications">Notifications</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Format</InputLabel>
                <Select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  label="Format"
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={formData.dateRange}
                  onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                  label="Date Range"
                >
                  <MenuItem value="last7days">Last 7 Days</MenuItem>
                  <MenuItem value="last30days">Last 30 Days</MenuItem>
                  <MenuItem value="last90days">Last 90 Days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Export</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
