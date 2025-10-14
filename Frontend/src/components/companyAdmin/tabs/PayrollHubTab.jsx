import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, AttachMoney as MoneyIcon, Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon, Schedule as ScheduleIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import PayrollTable from '../components/PayrollTable';
import AddPayrollModal from '../components/AddPayrollModal';

export default function PayrollHubTab() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddPayroll, setShowAddPayroll] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalPayroll: 0,
    paidRecords: 0,
    pendingRecords: 0,
    processingRecords: 0
  });

  const loadStaff = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, department, role')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  }, [companyId]);

  const loadPayrollRecords = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('company_id', companyId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayrollRecords(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading payroll records:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, loadMetrics]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { data: allRecords },
        { count: paidRecords },
        { count: pendingRecords },
        { count: processingRecords }
      ] = await Promise.all([
        supabase.from('payroll_records').select('net_pay').eq('company_id', companyId),
        supabase.from('payroll_records').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'paid'),
        supabase.from('payroll_records').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending'),
        supabase.from('payroll_records').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'processing')
      ]);

      const totalPayroll = (allRecords || []).reduce((sum, record) => sum + (parseFloat(record.net_pay) || 0), 0);

      setMetrics({
        totalPayroll,
        paidRecords: paidRecords || 0,
        pendingRecords: pendingRecords || 0,
        processingRecords: processingRecords || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadStaff();
    loadPayrollRecords();
  }, [loadStaff, loadPayrollRecords]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredPayrollRecords = payrollRecords.filter(record => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search || 
        record.employee_name?.toLowerCase().includes(searchTerm) ||
        record.department?.toLowerCase().includes(searchTerm)) &&
      (!filters.status || record.status === filters.status)
    );
  });

  const handlePayrollSuccess = () => {
    setShowAddPayroll(false);
    loadPayrollRecords();
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
          Payroll & Compensation
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddPayroll(true)}
        >
          Add Payroll Record
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" color="primary">{formatCurrency(metrics.totalPayroll)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Payroll</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReceiptIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.paidRecords}</Typography>
              <Typography variant="body2" color="text.secondary">Paid Records</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.pendingRecords}</Typography>
              <Typography variant="body2" color="text.secondary">Pending Records</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.processingRecords}</Typography>
              <Typography variant="body2" color="text.secondary">Processing</Typography>
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
                label="Search by Name or Department"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payroll Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Payroll Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payroll Records Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Payroll Records</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddPayroll(true)}
              size="small"
            >
              Add Record
            </Button>
          </Box>
          {filteredPayrollRecords.length === 0 ? (
            <Alert severity="info">
              No payroll records found. Add your first payroll record using the "Add Payroll Record" button.
            </Alert>
          ) : (
            <PayrollTable 
              payrollRecords={filteredPayrollRecords} 
              loading={loading}
              onUpdate={loadPayrollRecords}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Payroll Modal */}
      <AddPayrollModal
        open={showAddPayroll}
        onClose={() => setShowAddPayroll(false)}
        onSuccess={handlePayrollSuccess}
        staff={staff}
      />
    </Box>
  );
}
