import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon, FileUpload as FileUploadIcon, AttachMoney as AttachMoneyIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function PayrollTab() {
  const [payroll, setPayroll] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddPayroll, setShowAddPayroll] = useState(false);
  const [showEditPayroll, setShowEditPayroll] = useState(false);
  const [showViewPayrollDetails, setShowViewPayrollDetails] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  
  // Form states
  const [payrollForm, setPayrollForm] = useState({
    employee: '',
    department: '',
    salary: '',
    bonus: '',
    deductions: '',
    paymentDate: '',
    status: 'Pending'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthYearFilter, setMonthYearFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: payrollData }, { data: staffData }] = await Promise.all([
        supabase
          .from('payroll')
          .select(`
            id, staff_id, period, base, overtime, bonus, deductions, net_pay, payment_date, status, created_at,
            users!inner(name, department, role)
          `)
          .eq('company_id', companyId)
          .order('period', { ascending: false }),
        supabase
          .from('users')
          .select('user_id, name, department, role, is_active')
          .eq('company_id', companyId)
          .eq('is_active', true)
      ]);
      
      // Transform payroll data to include employee names
      const transformedPayroll = (payrollData || []).map(record => ({
        ...record,
        employee: record.users?.name || 'Unknown',
        department: record.users?.department || 'N/A',
        role: record.users?.role || 'N/A'
      }));
      
      setPayroll(transformedPayroll);
      setStaff(staffData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);
  const handleAddPayroll = async () => {
    try {
      if (!payrollForm.employee || !payrollForm.salary) return;
      const salary = Number(payrollForm.salary || 0);
      const bonus = Number(payrollForm.bonus || 0);
      const deductions = Number(payrollForm.deductions || 0);
      const netPay = salary + bonus - deductions;
      
      await supabase.from('payroll').insert([{
        company_id: companyId,
        staff_id: payrollForm.employee,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM format
        base: salary,
        overtime: 0,
        bonus: bonus,
        deductions: deductions,
        net_pay: netPay,
        payment_date: payrollForm.paymentDate || null,
        status: payrollForm.status.toLowerCase()
      }]);
      setShowAddPayroll(false);
      setPayrollForm({
        employee: '',
        department: '',
        salary: '',
        bonus: '',
        deductions: '',
        paymentDate: '',
        status: 'Pending'
      });
      loadData();
    } catch (error) {
      console.error('Error adding payroll:', error);
    }
  };

  const filteredPayroll = payroll.filter(record => 
    (searchTerm ? record.employee?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   record.department?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? record.department === departmentFilter : true) &&
    (statusFilter ? record.status === statusFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Payroll & Compensation
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => console.log('Import Payroll Data')}
          >
            Import Payroll Data
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddPayroll(true)}
          >
            Add Payroll Entry
          </Button>
        </Box>
      </Box>

      {/* Payroll Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Payroll Records</Typography>
          <DataTable
            data={filteredPayroll}
            loading={loading}
            columns={[
              { 
                field: 'employee', 
                headerName: 'Employee',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                      {params.value?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'department', 
                headerName: 'Department',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'base', 
                headerName: 'Salary',
                renderCell: (params) => (
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    ${Number(params.value || 0).toLocaleString()}
                  </Typography>
                )
              },
              { 
                field: 'bonus', 
                headerName: 'Bonus',
                renderCell: (params) => (
                  <Typography variant="body2" color="success.main">
                    ${Number(params.value || 0).toLocaleString()}
                  </Typography>
                )
              },
              { 
                field: 'deductions', 
                headerName: 'Deductions',
                renderCell: (params) => (
                  <Typography variant="body2" color="error.main">
                    ${Number(params.value || 0).toLocaleString()}
                  </Typography>
                )
              },
              { 
                field: 'net_pay', 
                headerName: 'Net Pay',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    ${Number(params.value || 0).toLocaleString()}
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
                    color={params.value === 'paid' ? 'success' : params.value === 'pending' ? 'warning' : 'error'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Edit Payroll Entry', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'Mark as Paid', icon: <CheckCircleIcon />, onClick: ({ row }) => console.log('Mark Paid', row) },
              { label: 'View Payroll Details', icon: <VisibilityIcon />, onClick: ({ row }) => console.log('View', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>
      {/* Add Payroll Modal */}
      <Dialog open={showAddPayroll} onClose={() => setShowAddPayroll(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payroll Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={payrollForm.employee}
                  label="Employee"
                  onChange={(e) => {
                    const selectedEmp = staff.find(emp => emp.user_id === e.target.value);
                    setPayrollForm({
                      ...payrollForm, 
                      employee: e.target.value,
                      department: selectedEmp?.department || ''
                    });
                  }}
                >
                  {staff.map(emp => (
                    <MenuItem key={emp.user_id} value={emp.user_id}>
                      {emp.name} ({emp.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salary Amount"
                type="number"
                value={payrollForm.salary}
                onChange={(e) => setPayrollForm({...payrollForm, salary: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bonus Amount"
                type="number"
                value={payrollForm.bonus}
                onChange={(e) => setPayrollForm({...payrollForm, bonus: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deductions"
                type="number"
                value={payrollForm.deductions}
                onChange={(e) => setPayrollForm({...payrollForm, deductions: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={payrollForm.paymentDate}
                onChange={(e) => setPayrollForm({...payrollForm, paymentDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={payrollForm.status}
                  label="Status"
                  onChange={(e) => setPayrollForm({...payrollForm, status: e.target.value})}
                >
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddPayroll(false)}>Cancel</Button>
          <Button onClick={handleAddPayroll} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
