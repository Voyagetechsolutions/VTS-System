import React, { useEffect, useState } from 'react';
import { Grid, Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar } from '@mui/material';
import { People as PeopleIcon, CheckCircle as CheckCircleIcon, PauseCircle as PauseCircleIcon, DirectionsBus as BusIcon, Receipt as ReceiptIcon, Build as BuildIcon, Description as DescriptionIcon, Notifications as NotificationsIcon, AccessTime as TimeIcon, Business as BusinessIcon, PersonAdd as PersonAddIcon, Assignment as AssignmentIcon, Schedule as ScheduleIcon, Add as AddIcon } from '@mui/icons-material';
import DashboardCard, { StatsCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function HROverviewTab() {
  const [kpis, setKpis] = useState({ total: 0, active: 0, inactive: 0, drivers: 0, bookings: 0, maintenance: 0, openings: 0 });
  const [employees, setEmployees] = useState([]);
  const [openJobs, setOpenJobs] = useState([]);
  const [deptSummary, setDeptSummary] = useState([]);
  const [dailyCheckins, setDailyCheckins] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [showScheduleMaintenance, setShowScheduleMaintenance] = useState(false);
  
  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    department: '',
    status: 'Active'
  });
  
  const [driverForm, setDriverForm] = useState({
    driver: '',
    bus: '',
    route: '',
    startDate: ''
  });
  
  const [bookingForm, setBookingForm] = useState({
    passengerName: '',
    bus: '',
    route: '',
    date: '',
    time: '',
    seatNo: '',
    paymentStatus: 'Pending'
  });
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    bus: '',
    taskType: '',
    date: '',
    assignedStaff: ''
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  useEffect(() => { 
    (async () => {
      const start = new Date(); 
      start.setHours(0,0,0,0); 
      const end = new Date(); 
      end.setHours(23,59,59,999);
      
      const [{ data: users }, { data: jobs }, { data: atd }] = await Promise.all([
        supabase.from('users').select('user_id, name, email, role, is_active, department').eq('company_id', companyId),
        supabase.from('job_postings').select('*').eq('company_id', companyId).eq('status', 'open').order('created_at', { ascending: false }),
        supabase.from('attendance').select('id, staff_id, check_in, check_out').eq('company_id', companyId).gte('check_in', start.toISOString()).lte('check_in', end.toISOString()),
      ]);
      
      const total = (users||[]).length;
      const active = (users||[]).filter(u=>u.is_active!==false).length;
      const inactive = total - active;
      const roleCount = (r) => (users||[]).filter(u=>String(u.role||'')===r).length;
      
      // Process department summary
      const byDept = new Map();
      (users||[]).forEach(u => {
        const dept = u.department || u.role || 'unknown';
        if (!byDept.has(dept)) byDept.set(dept, { dept, checkedIn: 0, users: 0, bookings: 0, maintenance: 0 });
        byDept.get(dept).users += 1;
      });
      (atd||[]).forEach(a => {
        const u = (users||[]).find(x => x.user_id === a.staff_id);
        const dept = u?.department || u?.role || 'unknown';
        if (!byDept.has(dept)) byDept.set(dept, { dept, checkedIn: 0, users: 0, bookings: 0, maintenance: 0 });
        byDept.get(dept).checkedIn += 1;
      });
      
      // Process daily check-ins
      const checkins = (atd||[]).map(a => {
        const u = (users||[]).find(x => x.user_id === a.staff_id);
        return {
          employee: u?.name || 'Unknown',
          department: u?.department || u?.role || 'unknown',
          checkInTime: a.check_in,
          status: a.check_out ? 'Completed' : 'Active'
        };
      });
      
      setEmployees(users||[]);
      setDeptSummary(Array.from(byDept.values()).sort((a,b)=>a.dept.localeCompare(b.dept)));
      setDailyCheckins(checkins);
      setKpis({ 
        total, 
        active, 
        inactive, 
        drivers: roleCount('driver'), 
        bookings: roleCount('booking_officer'), 
        maintenance: roleCount('maintenance_manager'), 
        openings: (jobs||[]).length 
      });
      setOpenJobs(jobs||[]);
    })(); 
  }, [companyId]);

  const handleAddEmployee = async () => {
    try {
      await supabase.from('users').insert([{
        company_id: companyId,
        name: employeeForm.name,
        email: employeeForm.email.toLowerCase(),
        phone: employeeForm.phone,
        role: employeeForm.role,
        department: employeeForm.department,
        is_active: employeeForm.status === 'Active'
      }]);
      setShowAddEmployee(false);
      setEmployeeForm({ name: '', email: '', phone: '', role: 'staff', department: '', status: 'Active' });
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const handleAssignDriver = async () => {
    try {
      // TODO: Implement driver assignment functionality
      console.log('Assigning driver:', driverForm);
      setShowAssignDriver(false);
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  };

  const handleCreateBooking = async () => {
    try {
      // TODO: Implement booking creation functionality
      console.log('Creating booking:', bookingForm);
      setShowCreateBooking(false);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleScheduleMaintenance = async () => {
    try {
      // TODO: Implement maintenance scheduling functionality
      console.log('Scheduling maintenance:', maintenanceForm);
      setShowScheduleMaintenance(false);
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    (searchTerm ? emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? emp.department === departmentFilter : true) &&
    (statusFilter ? (emp.is_active ? 'Active' : 'Inactive') === statusFilter : true) &&
    (roleFilter ? emp.role === roleFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          HR Manager Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
          <IconButton>
            <NotificationsIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Top KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary" fontWeight="bold">
                {kpis.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Employees</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {kpis.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Employees</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <PauseCircleIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {kpis.inactive}
              </Typography>
              <Typography variant="body2" color="text.secondary">Inactive Employees</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <BusIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {kpis.drivers}
              </Typography>
              <Typography variant="body2" color="text.secondary">Drivers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <ReceiptIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {kpis.bookings}
              </Typography>
              <Typography variant="body2" color="text.secondary">Bookings</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <BuildIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" color="secondary.main" fontWeight="bold">
                {kpis.maintenance}
              </Typography>
              <Typography variant="body2" color="text.secondary">Maintenance Tasks</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <DescriptionIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {kpis.openings}
              </Typography>
              <Typography variant="body2" color="text.secondary">Open Positions</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" sx={{ mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => setShowAddEmployee(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PersonAddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Add Employee
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add new staff member
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => setShowAssignDriver(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Assign Driver
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assign driver to bus/route
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => setShowCreateBooking(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <ReceiptIcon sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Create Booking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manually create booking
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => setShowScheduleMaintenance(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Schedule Maintenance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assign maintenance task
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tables */}
      <Grid container spacing={3}>
        {/* Employees Table */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Employees</Typography>
              <DataTable
                data={filteredEmployees}
                loading={false}
                columns={[
                  { 
                    field: 'name', 
                    headerName: 'Name',
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
                    field: 'role', 
                    headerName: 'Role',
                    renderCell: (params) => (
                      <Chip 
                        label={params.value} 
                        size="small" 
                        color={params.value === 'driver' ? 'primary' : 'default'}
                      />
                    )
                  },
                  { 
                    field: 'department', 
                    headerName: 'Department',
                    renderCell: (params) => (
                      <Typography variant="body2">
                        {params.value || 'N/A'}
                      </Typography>
                    )
                  },
                  { 
                    field: 'is_active', 
                    headerName: 'Status',
                    renderCell: (params) => (
                      <Chip 
                        label={params.value ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={params.value ? 'success' : 'error'}
                      />
                    )
                  },
                  { 
                    field: 'email', 
                    headerName: 'Email',
                    renderCell: (params) => (
                      <Typography variant="body2" color="text.secondary">
                        {params.value}
                      </Typography>
                    )
                  },
                ]}
                rowActions={[
                  { label: 'View Profile', icon: <AddIcon />, onClick: ({ row }) => console.log('View', row) },
                  { label: 'Edit', icon: <AddIcon />, onClick: ({ row }) => console.log('Edit', row) },
                  { label: 'Toggle Status', icon: <AddIcon />, onClick: ({ row }) => console.log('Toggle', row) }
                ]}
                searchable
                pagination
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Department Summary */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Department Summary</Typography>
              <DataTable
                data={deptSummary}
                loading={false}
                columns={[
                  { 
                    field: 'dept', 
                    headerName: 'Department',
                    renderCell: (params) => (
                      <Typography variant="body2" fontWeight="medium">
                        {params.value}
                      </Typography>
                    )
                  },
                  { 
                    field: 'users', 
                    headerName: 'Employees',
                    renderCell: (params) => (
                      <Typography variant="body2" color="primary">
                        {params.value}
                      </Typography>
                    )
                  },
                  { 
                    field: 'checkedIn', 
                    headerName: 'Active Today',
                    renderCell: (params) => (
                      <Chip 
                        label={params.value} 
                        size="small" 
                        color="success"
                      />
                    )
                  },
                  { 
                    field: 'bookings', 
                    headerName: 'Bookings',
                    renderCell: (params) => (
                      <Typography variant="body2" color="text.secondary">
                        {params.value}
                      </Typography>
                    )
                  },
                  { 
                    field: 'maintenance', 
                    headerName: 'Maintenance',
                    renderCell: (params) => (
                      <Typography variant="body2" color="text.secondary">
                        {params.value}
                      </Typography>
                    )
                  }
                ]}
                searchable={false}
                pagination={false}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Check-ins */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Daily Check-ins</Typography>
              <DataTable
                data={dailyCheckins}
                loading={false}
                columns={[
                  { 
                    field: 'employee', 
                    headerName: 'Employee',
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
                    field: 'checkInTime', 
                    headerName: 'Check-in Time',
                    renderCell: (params) => (
                      <Typography variant="body2" color="text.secondary">
                        {new Date(params.value).toLocaleTimeString()}
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
                        color={params.value === 'Completed' ? 'success' : 'warning'}
                      />
                    )
                  }
                ]}
                rowActions={[
                  { label: 'View Details', icon: <AddIcon />, onClick: ({ row }) => console.log('View Details', row) }
                ]}
                searchable
                pagination
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Employee Modal */}
      <Dialog open={showAddEmployee} onClose={() => setShowAddEmployee(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={employeeForm.role}
                  label="Role"
                  onChange={(e) => setEmployeeForm({...employeeForm, role: e.target.value})}
                >
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={employeeForm.department}
                  label="Department"
                  onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                >
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={employeeForm.status}
                  label="Status"
                  onChange={(e) => setEmployeeForm({...employeeForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddEmployee(false)}>Cancel</Button>
          <Button onClick={handleAddEmployee} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Driver Modal */}
      <Dialog open={showAssignDriver} onClose={() => setShowAssignDriver(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Driver</InputLabel>
                <Select
                  value={driverForm.driver}
                  label="Select Driver"
                  onChange={(e) => setDriverForm({...driverForm, driver: e.target.value})}
                >
                  {employees.filter(emp => emp.role === 'driver').map(emp => (
                    <MenuItem key={emp.user_id} value={emp.user_id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bus"
                value={driverForm.bus}
                onChange={(e) => setDriverForm({...driverForm, bus: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Route"
                value={driverForm.route}
                onChange={(e) => setDriverForm({...driverForm, route: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={driverForm.startDate}
                onChange={(e) => setDriverForm({...driverForm, startDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDriver(false)}>Cancel</Button>
          <Button onClick={handleAssignDriver} variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Create Booking Modal */}
      <Dialog open={showCreateBooking} onClose={() => setShowCreateBooking(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Booking</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Passenger Name"
                value={bookingForm.passengerName}
                onChange={(e) => setBookingForm({...bookingForm, passengerName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bus"
                value={bookingForm.bus}
                onChange={(e) => setBookingForm({...bookingForm, bus: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Route"
                value={bookingForm.route}
                onChange={(e) => setBookingForm({...bookingForm, route: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={bookingForm.time}
                onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seat Number"
                value={bookingForm.seatNo}
                onChange={(e) => setBookingForm({...bookingForm, seatNo: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={bookingForm.paymentStatus}
                  label="Payment Status"
                  onChange={(e) => setBookingForm({...bookingForm, paymentStatus: e.target.value})}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateBooking(false)}>Cancel</Button>
          <Button onClick={handleCreateBooking} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Maintenance Modal */}
      <Dialog open={showScheduleMaintenance} onClose={() => setShowScheduleMaintenance(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bus"
                value={maintenanceForm.bus}
                onChange={(e) => setMaintenanceForm({...maintenanceForm, bus: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Task Type</InputLabel>
                <Select
                  value={maintenanceForm.taskType}
                  label="Task Type"
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, taskType: e.target.value})}
                >
                  <MenuItem value="Routine">Routine</MenuItem>
                  <MenuItem value="Repair">Repair</MenuItem>
                  <MenuItem value="Inspection">Inspection</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={maintenanceForm.date}
                onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Assigned Staff</InputLabel>
                <Select
                  value={maintenanceForm.assignedStaff}
                  label="Assigned Staff"
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, assignedStaff: e.target.value})}
                >
                  {employees.filter(emp => emp.role === 'maintenance_manager' || emp.role === 'staff').map(emp => (
                    <MenuItem key={emp.user_id} value={emp.user_id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScheduleMaintenance(false)}>Cancel</Button>
          <Button onClick={handleScheduleMaintenance} variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


