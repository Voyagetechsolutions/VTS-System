import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert, Tabs, Tab
} from '@mui/material';
import {
  Add as AddIcon, Inventory as InventoryIcon, Warning as LowStockIcon,
  CheckCircle as AvailableIcon, Error as OutOfStockIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import StockTable from '../components/StockTable';
import UsageTable from '../components/UsageTable';
import AddStockModal from '../components/AddStockModal';
import AddUsageModal from '../components/AddUsageModal';

export default function InventoryHubTab() {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAddUsage, setShowAddUsage] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalParts: 0,
    availableParts: 0,
    lowStockParts: 0,
    outOfStockParts: 0
  });

  const loadStock = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_stock')
        .select('*')
        .eq('company_id', companyId)
        .order('part_name', { ascending: true });

      if (error) throw error;
      setStock(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadUsage = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_usage')
        .select(`
          *,
          part:part_id(part_name),
          bus:bus_id(name, license_plate)
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (error) throw error;
      setUsage(data || []);
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: totalParts },
        { count: availableParts },
        { count: lowStockParts },
        { count: outOfStockParts }
      ] = await Promise.all([
        supabase.from('inventory_stock').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('inventory_stock').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'available'),
        supabase.from('inventory_stock').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'low'),
        supabase.from('inventory_stock').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'out_of_stock')
      ]);

      setMetrics({
        totalParts: totalParts || 0,
        availableParts: availableParts || 0,
        lowStockParts: lowStockParts || 0,
        outOfStockParts: outOfStockParts || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadStock();
    loadUsage();
  }, [loadStock, loadUsage]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredStock = stock.filter(item => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search || 
        item.part_name?.toLowerCase().includes(searchTerm) ||
        item.part_number?.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm)) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.status || item.status === filters.status)
    );
  });

  const filteredUsage = usage.filter(item => {
    const usageDate = new Date(item.date).toISOString().split('T')[0];
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search || 
        item.part?.part_name?.toLowerCase().includes(searchTerm) ||
        item.bus?.name?.toLowerCase().includes(searchTerm)) &&
      (!filters.startDate || usageDate >= filters.startDate) &&
      (!filters.endDate || usageDate <= filters.endDate)
    );
  });

  const handleStockSuccess = () => {
    setShowAddStock(false);
    loadStock();
  };

  const handleUsageSuccess = () => {
    setShowAddUsage(false);
    loadUsage();
    loadStock(); // Refresh stock to update quantities
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory & Parts Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAddUsage(true)}
          >
            Add Usage
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddStock(true)}
          >
            Add Stock
          </Button>
        </Box>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalParts}</Typography>
              <Typography variant="body2" color="text.secondary">Total Parts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AvailableIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.availableParts}</Typography>
              <Typography variant="body2" color="text.secondary">Available</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <LowStockIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.lowStockParts}</Typography>
              <Typography variant="body2" color="text.secondary">Low Stock</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <OutOfStockIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.outOfStockParts}</Typography>
              <Typography variant="body2" color="text.secondary">Out of Stock</Typography>
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
                label="Search by Part Name, Number, or Category"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="engine">Engine</MenuItem>
                  <MenuItem value="tires">Tires</MenuItem>
                  <MenuItem value="electrical">Electrical</MenuItem>
                  <MenuItem value="brakes">Brakes</MenuItem>
                  <MenuItem value="filters">Filters</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
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
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="low">Low Stock</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
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
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for Stock and Usage */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label="Stock Inventory" />
            <Tab label="Usage History" />
          </Tabs>

          {tabValue === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Stock Inventory</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddStock(true)}
                  size="small"
                >
                  Add Stock
                </Button>
              </Box>
              {filteredStock.length === 0 ? (
                <Alert severity="info">
                  No stock records found. Add your first inventory item using the "Add Stock" button.
                </Alert>
              ) : (
                <StockTable 
                  stock={filteredStock} 
                  loading={loading}
                  onUpdate={loadStock}
                />
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Usage History</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddUsage(true)}
                  size="small"
                >
                  Add Usage
                </Button>
              </Box>
              {filteredUsage.length === 0 ? (
                <Alert severity="info">
                  No usage records found. Add your first usage record using the "Add Usage" button.
                </Alert>
              ) : (
                <UsageTable 
                  usage={filteredUsage} 
                  onUpdate={loadUsage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddStockModal
        open={showAddStock}
        onClose={() => setShowAddStock(false)}
        onSuccess={handleStockSuccess}
      />

      <AddUsageModal
        open={showAddUsage}
        onClose={() => setShowAddUsage(false)}
        onSuccess={handleUsageSuccess}
        stock={stock}
      />
    </Box>
  );
}
