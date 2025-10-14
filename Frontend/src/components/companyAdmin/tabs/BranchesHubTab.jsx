import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, Business as BranchIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import BranchesTable from '../components/BranchesTable';
import AddBranchModal from '../components/AddBranchModal';

export default function BranchesHubTab() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddBranch, setShowAddBranch] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalBranches: 0
  });

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) throw error;
      setBranches(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const { count: totalBranches } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      setMetrics({
        totalBranches: totalBranches || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredBranches = branches.filter(branch => {
    const searchTerm = filters.search.toLowerCase();
    return (
      !filters.search || 
      branch.name?.toLowerCase().includes(searchTerm) ||
      branch.location?.toLowerCase().includes(searchTerm)
    );
  });

  const handleBranchSuccess = () => {
    setShowAddBranch(false);
    loadBranches();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Branches Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddBranch(true)}
        >
          Add Branch
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BranchIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalBranches}</Typography>
              <Typography variant="body2" color="text.secondary">Total Branches</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search by Branch Name or Location"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                placeholder="Search branches..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Branches Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Branches</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddBranch(true)}
              size="small"
            >
              Add Branch
            </Button>
          </Box>
          {filteredBranches.length === 0 ? (
            <Alert severity="info">
              No branches found. Add your first branch using the "Add Branch" button.
            </Alert>
          ) : (
            <BranchesTable 
              branches={filteredBranches} 
              loading={loading}
              onUpdate={loadBranches}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Branch Modal */}
      <AddBranchModal
        open={showAddBranch}
        onClose={() => setShowAddBranch(false)}
        onSuccess={handleBranchSuccess}
      />
    </Box>
  );
}
