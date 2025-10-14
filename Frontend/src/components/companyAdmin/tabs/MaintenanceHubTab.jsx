import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Alert,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon, Build as MaintenanceIcon, AttachMoney as CostIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import MaintenanceTable from '../components/MaintenanceTable';
import AddMaintenanceModal from '../components/AddMaintenanceModal';

export default function MaintenanceHubTab() {
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalLogs: 0,
    totalCost: 0,
    routineMaintenance: 0,
    emergencyMaintenance: 0
  });

  const loadMaintenanceLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (error) throw error;
      setMaintenanceLogs(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading maintenance logs:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      // Total logs count
      const { count: totalLogs } = await supabase
        .from('maintenance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Total cost
      const { data: costData } = await supabase
        .from('maintenance_logs')
        .select('cost')
        .eq('company_id', companyId);

      const totalCost = costData?.reduce((sum, log) => sum + (parseFloat(log.cost) || 0), 0) || 0;

      // Routine maintenance count
      const { count: routineMaintenance } = await supabase
        .from('maintenance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('type', 'Routine');

      // Emergency maintenance count
      const { count: emergencyMaintenance } = await supabase
        .from('maintenance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('type', 'Emergency');

      setMetrics({
        totalLogs: totalLogs || 0,
        totalCost,
        routineMaintenance: routineMaintenance || 0,
        emergencyMaintenance: emergencyMaintenance || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadMaintenanceLogs();
  }, [loadMaintenanceLogs]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredLogs = maintenanceLogs.filter(log => {
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
      log.bus_name?.toLowerCase().includes(searchTerm) ||
      log.notes?.toLowerCase().includes(searchTerm);

    const matchesType = !filters.type || log.type === filters.type;

    const logDate = new Date(log.date);
    const matchesDateFrom = !filters.dateFrom || logDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || logDate <= new Date(filters.dateTo);

    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  const handleMaintenanceSuccess = () => {
    setShowAddMaintenance(false);
    loadMaintenanceLogs();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Maintenance Logs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddMaintenance(true)}
        >
          Add Log
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MaintenanceIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalLogs}</Typography>
              <Typography variant="body2" color="text.secondary">Total Logs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CostIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{formatCurrency(metrics.totalCost)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Cost</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MaintenanceIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.routineMaintenance}</Typography>
              <Typography variant="body2" color="text.secondary">Routine</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.emergencyMaintenance}</Typography>
              <Typography variant="body2" color="text.secondary">Emergency</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search by Bus Name or Notes"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                placeholder="Search maintenance logs..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Routine">Routine</MenuItem>
                  <MenuItem value="Major">Major</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="From Date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="To Date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Maintenance Logs Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Maintenance Logs</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddMaintenance(true)}
              size="small"
            >
              Add Log
            </Button>
          </Box>
          {filteredLogs.length === 0 ? (
            <Alert severity="info">
              No maintenance logs found. Add your first log using the "Add Log" button.
            </Alert>
          ) : (
            <MaintenanceTable 
              logs={filteredLogs} 
              loading={loading}
              onUpdate={loadMaintenanceLogs}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Maintenance Modal */}
      <AddMaintenanceModal
        open={showAddMaintenance}
        onClose={() => setShowAddMaintenance(false)}
        onSuccess={handleMaintenanceSuccess}
      />
    </Box>
  );
}
