import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch, Autocomplete } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, Pause as PauseIcon, FileUpload as FileUploadIcon, People as PeopleIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function ShiftsTab() {
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddShift, setShowAddShift] = useState(false);
  const [showEditShift, setShowEditShift] = useState(false);
  const [showViewAssignedEmployees, setShowViewAssignedEmployees] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  
  // Form states
  const [shiftForm, setShiftForm] = useState({
    shiftName: '',
    department: '',
    startTime: '',
    endTime: '',
    assignedEmployees: [],
    status: 'Active'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: shiftsData }, { data: staffData }] = await Promise.all([
        supabase
          .from('staff_shifts')
          .select(`
            id, shift_name, department, start_time, end_time, assigned_employees, status, created_at
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('user_id, name, department, role, is_active')
          .eq('company_id', companyId)
          .eq('is_active', true)
      ]);
      
      setShifts(shiftsData || []);
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
  const handleAddShift = async () => {
    try {
      if (!shiftForm.shiftName || !shiftForm.department || !shiftForm.startTime || !shiftForm.endTime) return;
      await supabase.from('staff_shifts').insert([{
        company_id: companyId,
        shift_name: shiftForm.shiftName,
        department: shiftForm.department,
        start_time: shiftForm.startTime,
        end_time: shiftForm.endTime,
        assigned_employees: shiftForm.assignedEmployees,
        status: shiftForm.status.toLowerCase()
      }]);
      setShowAddShift(false);
      setShiftForm({
        shiftName: '',
        department: '',
        startTime: '',
        endTime: '',
        assignedEmployees: [],
        status: 'Active'
      });
      loadData();
    } catch (error) {
      console.error('Error adding shift:', error);
    }
  };

  const filteredShifts = shifts.filter(shift => 
    (searchTerm ? shift.shift_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   shift.department?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? shift.department === departmentFilter : true) &&
    (statusFilter ? shift.status === statusFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Shifts
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => console.log('Import Shifts')}
          >
            Import Shifts
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddShift(true)}
          >
            Add Shift
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by Shift Name or Department"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
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

      {/* Shifts Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Shift Templates</Typography>
          <DataTable
            data={filteredShifts}
            loading={loading}
            columns={[
              { 
                field: 'shift_name', 
                headerName: 'Shift Name',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="medium">
                    {params.value}
                  </Typography>
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
                field: 'start_time', 
                headerName: 'Start Time',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'end_time', 
                headerName: 'End Time',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'assigned_employees', 
                headerName: 'Assigned Employees',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {params.value ? params.value.length : 0} employees
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'status', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color={params.value === 'active' ? 'success' : 'error'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Edit Shift', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'Activate/Deactivate', icon: <PauseIcon />, onClick: ({ row }) => console.log('Toggle', row) },
              { label: 'View Assigned Employees', icon: <VisibilityIcon />, onClick: ({ row }) => console.log('View', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Shift Modal */}
      <Dialog open={showAddShift} onClose={() => setShowAddShift(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Shift Name"
                value={shiftForm.shiftName}
                onChange={(e) => setShiftForm({...shiftForm, shiftName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={shiftForm.department}
                  label="Department"
                  onChange={(e) => setShiftForm({...shiftForm, department: e.target.value})}
                >
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm({...shiftForm, startTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm({...shiftForm, endTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={shiftForm.status}
                  label="Status"
                  onChange={(e) => setShiftForm({...shiftForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddShift(false)}>Cancel</Button>
          <Button onClick={handleAddShift} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


