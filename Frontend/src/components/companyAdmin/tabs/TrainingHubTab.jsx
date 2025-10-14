import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, School as SchoolIcon, Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon, Warning as WarningIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import TrainingTable from '../components/TrainingTable';
import AddTrainingModal from '../components/AddTrainingModal';

export default function TrainingHubTab() {
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddTraining, setShowAddTraining] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    employeeName: '',
    department: '',
    courseName: '',
    status: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalTrainings: 0,
    completedTrainings: 0,
    inProgressTrainings: 0,
    expiredCertifications: 0
  });

  const loadStaff = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, department')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  }, [companyId]);

  const loadTrainingRecords = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('training_certifications')
        .select('*')
        .eq('company_id', companyId)
        .order('date_assigned', { ascending: false });

      if (error) throw error;
      setTrainingRecords(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading training records:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [
        { count: totalTrainings },
        { count: completedTrainings },
        { count: inProgressTrainings },
        { count: expiredCertifications }
      ] = await Promise.all([
        supabase.from('training_certifications').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('training_certifications').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'completed'),
        supabase.from('training_certifications').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'in_progress'),
        supabase.from('training_certifications').select('*', { count: 'exact', head: true }).eq('company_id', companyId).lt('expiry_date', today)
      ]);

      setMetrics({
        totalTrainings: totalTrainings || 0,
        completedTrainings: completedTrainings || 0,
        inProgressTrainings: inProgressTrainings || 0,
        expiredCertifications: expiredCertifications || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadStaff();
    loadTrainingRecords();
  }, [loadStaff, loadTrainingRecords]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredTrainingRecords = trainingRecords.filter(record => {
    return (
      (!filters.employeeName || record.employee_name?.toLowerCase().includes(filters.employeeName.toLowerCase())) &&
      (!filters.department || record.department === filters.department) &&
      (!filters.courseName || record.course_name?.toLowerCase().includes(filters.courseName.toLowerCase())) &&
      (!filters.status || record.status === filters.status)
    );
  });

  const handleTrainingSuccess = () => {
    setShowAddTraining(false);
    loadTrainingRecords();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Training & Certification Tracking
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddTraining(true)}
        >
          Add Training Record
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalTrainings}</Typography>
              <Typography variant="body2" color="text.secondary">Total Trainings</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.completedTrainings}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.inProgressTrainings}</Typography>
              <Typography variant="body2" color="text.secondary">In Progress</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.expiredCertifications}</Typography>
              <Typography variant="body2" color="text.secondary">Expired</Typography>
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
                label="Search by Employee Name"
                value={filters.employeeName}
                onChange={(e) => handleFilterChange('employeeName', e.target.value)}
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
              <TextField
                fullWidth
                label="Search by Course Name"
                value={filters.courseName}
                onChange={(e) => handleFilterChange('courseName', e.target.value)}
                size="small"
              />
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
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Training Records Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Training Records</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddTraining(true)}
              size="small"
            >
              Add Training
            </Button>
          </Box>
          {filteredTrainingRecords.length === 0 ? (
            <Alert severity="info">
              No training records found. Add your first training record using the "Add Training Record" button.
            </Alert>
          ) : (
            <TrainingTable 
              trainingRecords={filteredTrainingRecords} 
              loading={loading}
              onUpdate={loadTrainingRecords}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Training Modal */}
      <AddTrainingModal
        open={showAddTraining}
        onClose={() => setShowAddTraining(false)}
        onSuccess={handleTrainingSuccess}
        staff={staff}
      />
    </Box>
  );
}
