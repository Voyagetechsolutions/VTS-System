import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, FormControl,
  InputLabel, Select, MenuItem, Stack, Alert
} from '@mui/material';
import {
  Add as AddIcon, Schedule as ScheduleIcon, People as PeopleIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import ShiftTable from '../components/ShiftTable';
import AttendanceTable from '../components/AttendanceTable';
import AddShiftModal from '../components/AddShiftModal';
import AddAttendanceModal from '../components/AddAttendanceModal';

export default function AttendanceHubTab() {
  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddShift, setShowAddShift] = useState(false);
  const [showAddAttendance, setShowAddAttendance] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    employeeName: '',
    department: '',
    role: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalShifts: 0,
    activeShifts: 0,
    presentToday: 0,
    absentToday: 0
  });

  const loadEmployees = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('user_id, name, department, role')
        .eq('company_id', companyId)
        .eq('is_active', true);
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, [companyId]);

  const loadShifts = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('shifts')
        .select(`
          *,
          employee:users!shifts_employee_id_fkey(name, department, role)
        `)
        .eq('company_id', companyId)
        .order('start_time', { ascending: false });
      setShifts(data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
    }
  }, [companyId]);

  const loadAttendance = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('attendance')
        .select(`
          *,
          employee:users!attendance_employee_id_fkey(name, department, role)
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false });
      setAttendance(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [
        { count: totalShifts },
        { count: activeShifts },
        { count: presentToday },
        { count: absentToday }
      ] = await Promise.all([
        supabase.from('shifts').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('shifts').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('date', today).eq('status', 'present'),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('date', today).eq('status', 'absent')
      ]);

      setMetrics({
        totalShifts: totalShifts || 0,
        activeShifts: activeShifts || 0,
        presentToday: presentToday || 0,
        absentToday: absentToday || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEmployees(),
        loadShifts(),
        loadAttendance(),
        loadMetrics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadEmployees, loadShifts, loadAttendance, loadMetrics]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredShifts = shifts.filter(shift => {
    const employee = shift.employee;
    return (
      (!filters.employeeName || employee?.name?.toLowerCase().includes(filters.employeeName.toLowerCase())) &&
      (!filters.department || employee?.department === filters.department) &&
      (!filters.role || employee?.role === filters.role) &&
      (!filters.status || shift.status === filters.status) &&
      (!filters.startDate || shift.start_time >= filters.startDate) &&
      (!filters.endDate || shift.end_time <= filters.endDate)
    );
  });

  const filteredAttendance = attendance.filter(record => {
    const employee = record.employee;
    return (
      (!filters.employeeName || employee?.name?.toLowerCase().includes(filters.employeeName.toLowerCase())) &&
      (!filters.department || employee?.department === filters.department) &&
      (!filters.role || employee?.role === filters.role) &&
      (!filters.status || record.status === filters.status) &&
      (!filters.startDate || record.date >= filters.startDate) &&
      (!filters.endDate || record.date <= filters.endDate)
    );
  });

  const handleShiftSuccess = () => {
    setShowAddShift(false);
    loadShifts();
    loadMetrics();
  };

  const handleAttendanceSuccess = () => {
    setShowAddAttendance(false);
    loadAttendance();
    loadMetrics();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Attendance & Shift Scheduling
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAddAttendance(true)}
          >
            Add Attendance Record
          </Button>
          <Button
            variant="contained"
            startIcon={<ScheduleIcon />}
            onClick={() => setShowAddShift(true)}
          >
            Add Shift
          </Button>
        </Stack>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalShifts}</Typography>
              <Typography variant="body2" color="text.secondary">Total Shifts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.activeShifts}</Typography>
              <Typography variant="body2" color="text.secondary">Active Shifts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.presentToday}</Typography>
              <Typography variant="body2" color="text.secondary">Present Today</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.absentToday}</Typography>
              <Typography variant="body2" color="text.secondary">Absent Today</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Employee Name"
                value={filters.employeeName}
                onChange={(e) => handleFilterChange('employeeName', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
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
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="hr_manager">HR Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
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

      {/* Scheduled Shifts Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Scheduled Shifts</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddShift(true)}
              size="small"
            >
              Add Shift
            </Button>
          </Box>
          {filteredShifts.length === 0 ? (
            <Alert severity="info">
              No shifts found. Add your first shift using the "Add Shift" button.
            </Alert>
          ) : (
            <ShiftTable 
              shifts={filteredShifts} 
              loading={loading}
              onUpdate={loadShifts}
              onMetricsUpdate={loadMetrics}
            />
          )}
        </CardContent>
      </Card>

      {/* Attendance Records Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Attendance Records</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddAttendance(true)}
              size="small"
            >
              Add Attendance Record
            </Button>
          </Box>
          {filteredAttendance.length === 0 ? (
            <Alert severity="info">
              No attendance records found. Add your first record using the "Add Attendance Record" button.
            </Alert>
          ) : (
            <AttendanceTable 
              attendance={filteredAttendance} 
              loading={loading}
              onUpdate={loadAttendance}
              onMetricsUpdate={loadMetrics}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddShiftModal
        open={showAddShift}
        onClose={() => setShowAddShift(false)}
        onSuccess={handleShiftSuccess}
        employees={employees}
      />

      <AddAttendanceModal
        open={showAddAttendance}
        onClose={() => setShowAddAttendance(false)}
        onSuccess={handleAttendanceSuccess}
        employees={employees}
      />
    </Box>
  );
}
