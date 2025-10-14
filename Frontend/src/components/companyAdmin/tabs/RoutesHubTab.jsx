import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, Route as RouteIcon, CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import RoutesTable from '../components/RoutesTable';
import AddRouteModal from '../components/AddRouteModal';

export default function RoutesHubTab() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddRoute, setShowAddRoute] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    inactiveRoutes: 0,
    avgPrice: 0
  });

  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', companyId)
        .order('pick_up', { ascending: true });

      if (error) throw error;
      setRoutes(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: totalRoutes },
        { count: activeRoutes },
        { count: inactiveRoutes },
        { data: priceData }
      ] = await Promise.all([
        supabase.from('routes').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('routes').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
        supabase.from('routes').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'inactive'),
        supabase.from('routes').select('price').eq('company_id', companyId)
      ]);

      const avgPrice = priceData && priceData.length > 0 
        ? priceData.reduce((sum, route) => sum + (parseFloat(route.price) || 0), 0) / priceData.length
        : 0;

      setMetrics({
        totalRoutes: totalRoutes || 0,
        activeRoutes: activeRoutes || 0,
        inactiveRoutes: inactiveRoutes || 0,
        avgPrice
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredRoutes = routes.filter(route => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search || 
        route.pick_up?.toLowerCase().includes(searchTerm) ||
        route.drop_off?.toLowerCase().includes(searchTerm) ||
        route.name?.toLowerCase().includes(searchTerm)) &&
      (!filters.status || route.status === filters.status)
    );
  });

  const handleRouteSuccess = () => {
    setShowAddRoute(false);
    loadRoutes();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Routes Management / Company Routes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddRoute(true)}
        >
          Add Route
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <RouteIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalRoutes}</Typography>
              <Typography variant="body2" color="text.secondary">Total Routes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ActiveIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.activeRoutes}</Typography>
              <Typography variant="body2" color="text.secondary">Active Routes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InactiveIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.inactiveRoutes}</Typography>
              <Typography variant="body2" color="text.secondary">Inactive Routes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="info.main" sx={{ mt: 2 }}>
                {formatCurrency(metrics.avgPrice)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Average Price</Typography>
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
                label="Search by Pick-up location, Drop-off location, or Route Name"
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
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Routes Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Company Routes</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddRoute(true)}
              size="small"
            >
              Add Route
            </Button>
          </Box>
          {filteredRoutes.length === 0 ? (
            <Alert severity="info">
              No routes found. Add your first route using the "Add Route" button.
            </Alert>
          ) : (
            <RoutesTable 
              routes={filteredRoutes} 
              loading={loading}
              onUpdate={loadRoutes}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Route Modal */}
      <AddRouteModal
        open={showAddRoute}
        onClose={() => setShowAddRoute(false)}
        onSuccess={handleRouteSuccess}
      />
    </Box>
  );
}
