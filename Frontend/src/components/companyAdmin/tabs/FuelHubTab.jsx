import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, LocalGasStation as FuelIcon, AttachMoney as CostIcon,
  Speed as EfficiencyIcon, TrendingUp as TrendIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import FuelTable from '../components/FuelTable';
import AddFuelModal from '../components/AddFuelModal';
import TopFuelCost from '../components/TopFuelCost';

export default function FuelHubTab() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddFuel, setShowAddFuel] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    station: '',
    dateFrom: '',
    dateTo: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalLogs: 0,
    totalLiters: 0,
    totalCost: 0,
    averageCostPerLiter: 0
  });

  const loadFuelLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (error) throw error;
      setFuelLogs(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading fuel logs:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      // Total logs count
      const { count: totalLogs } = await supabase
        .from('fuel_logs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Total liters and cost
      const { data: fuelData } = await supabase
        .from('fuel_logs')
        .select('liters, cost')
        .eq('company_id', companyId);

      const totalLiters = fuelData?.reduce((sum, log) => sum + (parseFloat(log.liters) || 0), 0) || 0;
      const totalCost = fuelData?.reduce((sum, log) => sum + (parseFloat(log.cost) || 0), 0) || 0;
      const averageCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

      setMetrics({
        totalLogs: totalLogs || 0,
        totalLiters,
        totalCost,
        averageCostPerLiter
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadFuelLogs();
  }, [loadFuelLogs]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredLogs = fuelLogs.filter(log => {
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
      log.bus_name?.toLowerCase().includes(searchTerm) ||
      log.station?.toLowerCase().includes(searchTerm);

    const matchesStation = !filters.station || 
      log.station?.toLowerCase().includes(filters.station.toLowerCase());

    const logDate = new Date(log.date);
    const matchesDateFrom = !filters.dateFrom || logDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || logDate <= new Date(filters.dateTo);

    return matchesSearch && matchesStation && matchesDateFrom && matchesDateTo;
  });

  const handleFuelSuccess = () => {
    setShowAddFuel(false);
    loadFuelLogs();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatLiters = (liters) => {
    return `${parseFloat(liters).toFixed(1)}L`;
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Fuel Tracking
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddFuel(true)}
        >
          Add Fuel
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FuelIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalLogs}</Typography>
              <Typography variant="body2" color="text.secondary">Total Records</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EfficiencyIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{formatLiters(metrics.totalLiters)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Fuel</Typography>
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
              <TrendIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{formatCurrency(metrics.averageCostPerLiter)}</Typography>
              <Typography variant="body2" color="text.secondary">Avg Cost/Liter</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Fuel Cost Widget */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TopFuelCost fuelLogs={fuelLogs} />
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
                label="Search by Bus Name or License Plate"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                placeholder="Search fuel logs..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Fuel Station"
                value={filters.station}
                onChange={(e) => handleFilterChange('station', e.target.value)}
                size="small"
                placeholder="Station name"
              />
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

      {/* Fuel Logs Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Fuel Records</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddFuel(true)}
              size="small"
            >
              Add Fuel
            </Button>
          </Box>
          {filteredLogs.length === 0 ? (
            <Alert severity="info">
              No fuel records found. Add your first fuel record using the "Add Fuel" button.
            </Alert>
          ) : (
            <FuelTable 
              logs={filteredLogs} 
              loading={loading}
              onUpdate={loadFuelLogs}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Fuel Modal */}
      <AddFuelModal
        open={showAddFuel}
        onClose={() => setShowAddFuel(false)}
        onSuccess={handleFuelSuccess}
      />
    </Box>
  );
}
