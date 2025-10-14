import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, DirectionsBus as BusIcon, Build as MaintenanceIcon,
  CheckCircle as ActiveIcon, Error as InactiveIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import BusesTable from '../components/BusesTable';
import AddBusModal from '../components/AddBusModal';

export default function BusesHubTab() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddBus, setShowAddBus] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalBuses: 0,
    activeBuses: 0,
    maintenanceBuses: 0,
    inactiveBuses: 0
  });

  const loadBuses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) throw error;
      setBuses(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading buses:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: totalBuses },
        { count: activeBuses },
        { count: maintenanceBuses },
        { count: inactiveBuses }
      ] = await Promise.all([
        supabase.from('buses').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('buses').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
        supabase.from('buses').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'maintenance'),
        supabase.from('buses').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'inactive')
      ]);

      setMetrics({
        totalBuses: totalBuses || 0,
        activeBuses: activeBuses || 0,
        maintenanceBuses: maintenanceBuses || 0,
        inactiveBuses: inactiveBuses || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadBuses();
  }, [loadBuses]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredBuses = buses.filter(bus => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search || 
        bus.name?.toLowerCase().includes(searchTerm) ||
        bus.type?.toLowerCase().includes(searchTerm) ||
        bus.model?.toLowerCase().includes(searchTerm) ||
        bus.license_plate?.toLowerCase().includes(searchTerm)) &&
      (!filters.status || bus.status === filters.status)
    );
  });

  const handleBusSuccess = () => {
    setShowAddBus(false);
    loadBuses();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Buses Management / Fleet Overview
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddBus(true)}
        >
          Add Bus
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BusIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalBuses}</Typography>
              <Typography variant="body2" color="text.secondary">Total Buses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ActiveIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.activeBuses}</Typography>
              <Typography variant="body2" color="text.secondary">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MaintenanceIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.maintenanceBuses}</Typography>
              <Typography variant="body2" color="text.secondary">Maintenance</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InactiveIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.inactiveBuses}</Typography>
              <Typography variant="body2" color="text.secondary">Inactive</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Search by Bus Name, Type, Model, or License Plate"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Buses Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Fleet Overview</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddBus(true)}
              size="small"
            >
              Add Bus
            </Button>
          </Box>
          {filteredBuses.length === 0 ? (
            <Alert severity="info">
              No buses found. Add your first bus using the "Add Bus" button.
            </Alert>
          ) : (
            <BusesTable 
              buses={filteredBuses} 
              loading={loading}
              onUpdate={loadBuses}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Bus Modal */}
      <AddBusModal
        open={showAddBus}
        onClose={() => setShowAddBus(false)}
        onSuccess={handleBusSuccess}
      />
    </Box>
  );
}
