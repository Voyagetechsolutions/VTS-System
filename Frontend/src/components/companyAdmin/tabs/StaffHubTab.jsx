import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, People as PeopleIcon, Work as WorkIcon,
  CheckCircle as CheckCircleIcon, Warning as WarningIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import StaffTable from '../components/StaffTable';
import AddStaffModal from '../components/AddStaffModal';

export default function StaffHubTab() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddStaff, setShowAddStaff] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: '',
    role: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalStaff: 0,
    activeStaff: 0,
    departments: 0,
    newThisMonth: 0
  });

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('company_id', companyId)
        .order('date_joined', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const [
        { count: totalStaff },
        { count: activeStaff },
        { data: departmentData },
        { count: newThisMonth }
      ] = await Promise.all([
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
        supabase.from('staff').select('department').eq('company_id', companyId),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('date_joined', currentMonth + '-01')
      ]);

      // Count unique departments
      const uniqueDepartments = new Set((departmentData || []).map(item => item.department)).size;

      setMetrics({
        totalStaff: totalStaff || 0,
        activeStaff: activeStaff || 0,
        departments: uniqueDepartments,
        newThisMonth: newThisMonth || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadStaff();
  }, [companyId]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredStaff = staff.filter(member => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search || 
        member.name?.toLowerCase().includes(searchTerm) ||
        member.email?.toLowerCase().includes(searchTerm) ||
        member.role?.toLowerCase().includes(searchTerm)) &&
      (!filters.department || member.department === filters.department) &&
      (!filters.status || member.status === filters.status) &&
      (!filters.role || member.role === filters.role)
    );
  });

  const handleStaffSuccess = () => {
    setShowAddStaff(false);
    loadStaff();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Staff Profiles & Roles
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddStaff(true)}
        >
          Add Staff Member
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalStaff}</Typography>
              <Typography variant="body2" color="text.secondary">Total Staff</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.activeStaff}</Typography>
              <Typography variant="body2" color="text.secondary">Active Staff</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WorkIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.departments}</Typography>
              <Typography variant="body2" color="text.secondary">Departments</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.newThisMonth}</Typography>
              <Typography variant="body2" color="text.secondary">New This Month</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search by Name, Email, or Role"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  label="Department"
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
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
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="hr_manager">HR Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Staff Members Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Staff Members</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddStaff(true)}
              size="small"
            >
              Add Staff
            </Button>
          </Box>
          {filteredStaff.length === 0 ? (
            <Alert severity="info">
              No staff members found. Add your first staff member using the "Add Staff Member" button.
            </Alert>
          ) : (
            <StaffTable 
              staff={filteredStaff} 
              loading={loading}
              onUpdate={loadStaff}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <AddStaffModal
        open={showAddStaff}
        onClose={() => setShowAddStaff(false)}
        onSuccess={handleStaffSuccess}
      />
    </Box>
  );
}
