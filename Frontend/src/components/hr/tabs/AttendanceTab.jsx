import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Schedule as ScheduleIcon, Visibility as VisibilityIcon, Edit as EditIcon, Notifications as NotificationsIcon, QrCodeScanner as QrCodeScannerIcon, CameraAlt as CameraAltIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function AttendanceTab() {
  const [attendance, setAttendance] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const [scheduledShifts, setScheduledShifts] = useState([]);
  const [editShiftOpen, setEditShiftOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  
  // Modal states
  const [showAddAttendance, setShowAddAttendance] = useState(false);
  const [showScheduleShift, setShowScheduleShift] = useState(false);
  const [showEditAttendance, setShowEditAttendance] = useState(false);
  const [showNotifyEmployee, setShowNotifyEmployee] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  
  // Form states
  const [attendanceForm, setAttendanceForm] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    status: 'Present'
  });
  
  const [shiftForm, setShiftForm] = useState({
    employee: '',
    department: '',
    shiftStartTime: '',
    shiftEndTime: '',
    repeat: 'None'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    start: '',
    end: ''
  });
  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: attendanceData }, { data: staffData }] = await Promise.all([
        supabase
          .from('attendance')
          .select(`
            id, staff_id, check_in, check_out, status, created_at,
            users!inner(name, department, role)
          `)
          .eq('company_id', companyId)
          .order('check_in', { ascending: false }),
        supabase
          .from('users')
          .select('user_id, name, department, role, is_active')
          .eq('company_id', companyId)
          .eq('is_active', true)
      ]);
      
      // Transform attendance data to include employee names
      const transformedAttendance = (attendanceData || []).map(record => ({
        ...record,
        employee: record.users?.name || 'Unknown',
        department: record.users?.department || 'N/A',
        role: record.users?.role || 'N/A'
      }));
      
      setAttendance(transformedAttendance);
      setStaff(staffData || []);

      // Load scheduled shifts if table exists
      try {
        const { data: ds } = await supabase
          .from('driver_shifts')
          .select('id, driver_id, department, start_time, end_time, repeat, status, created_at')
          .eq('company_id', companyId)
          .order('start_time', { ascending: true })
          .limit(500);
        setScheduledShifts(ds || []);
      } catch (e) {
        setScheduledShifts([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleAddAttendance = async () => {
    try {
      if (!attendanceForm.employee || !attendanceForm.date) return;
      await supabase.from('attendance').insert([{
        company_id: companyId,
        staff_id: attendanceForm.employee,
        check_in: new Date(`${attendanceForm.date}T${attendanceForm.checkInTime || '09:00'}`).toISOString(),
        check_out: attendanceForm.checkOutTime ? new Date(`${attendanceForm.date}T${attendanceForm.checkOutTime}`).toISOString() : null,
        status: attendanceForm.status.toLowerCase()
      }]);
      setShowAddAttendance(false);
      setAttendanceForm({
        employee: '',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '',
        checkOutTime: '',
        status: 'Present'
      });
      loadData();
    } catch (error) {
      console.error('Error adding attendance:', error);
    }
  };

  const handleScheduleShift = async () => {
    try {
      if (!shiftForm.employee || !shiftForm.shiftStartTime || !shiftForm.shiftEndTime) return;
      // Persist to driver_shifts (if table exists). Fallback: log error silently.
      const payload = {
        company_id: companyId,
        driver_id: shiftForm.employee,
        department: shiftForm.department || null,
        start_time: shiftForm.shiftStartTime,
        end_time: shiftForm.shiftEndTime,
        repeat: shiftForm.repeat,
        status: 'Assigned',
      };
      try {
        await supabase.from('driver_shifts').insert([payload]);
      } catch (e) {
        console.warn('driver_shifts insert failed; ensure table exists', e?.message || e);
      }
      setShowScheduleShift(false);
      setShiftForm({
        employee: '',
        department: '',
        shiftStartTime: '',
        shiftEndTime: '',
        repeat: 'None'
      });
      // Reload to reflect changes if driver_shifts also feeds into any views
      loadData();
    } catch (error) {
      console.error('Error scheduling shift:', error);
    }
  };

  const handleEditAttendance = async () => {
    try {
      if (!selectedAttendance) return;
      await supabase.from('attendance').update({
        check_in: new Date(`${attendanceForm.date}T${attendanceForm.checkInTime}`).toISOString(),
        check_out: attendanceForm.checkOutTime ? new Date(`${attendanceForm.date}T${attendanceForm.checkOutTime}`).toISOString() : null,
        status: attendanceForm.status.toLowerCase()
      }).eq('id', selectedAttendance.id);
      setShowEditAttendance(false);
      setSelectedAttendance(null);
      loadData();
    } catch (error) {
      console.error('Error editing attendance:', error);
    }
  };

  const handleNotifyEmployee = async (attendanceRecord) => {
    try {
      // TODO: Implement notification functionality
      console.log('Notifying employee:', attendanceRecord);
      alert('Notification functionality to be implemented');
    } catch (error) {
      console.error('Error notifying employee:', error);
    }
  };

  const handleEditAttendanceRecord = (record) => {
    setSelectedAttendance(record);
    setAttendanceForm({
      employee: record.staff_id,
      date: new Date(record.check_in).toISOString().split('T')[0],
      checkInTime: new Date(record.check_in).toTimeString().slice(0, 5),
      checkOutTime: record.check_out ? new Date(record.check_out).toTimeString().slice(0, 5) : '',
      status: record.status.charAt(0).toUpperCase() + record.status.slice(1)
    });
    setShowEditAttendance(true);
  };

  const filteredAttendance = attendance.filter(record => 
    (searchTerm ? record.employee?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   record.department?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? record.department === departmentFilter : true) &&
    (statusFilter ? record.status === statusFilter : true) &&
    (roleFilter ? record.role === roleFilter : true) &&
    (dateRangeFilter.start ? new Date(record.check_in) >= new Date(dateRangeFilter.start) : true) &&
    (dateRangeFilter.end ? new Date(record.check_in) <= new Date(dateRangeFilter.end) : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Attendance & Shift Scheduling
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setShowScheduleShift(true)}
          >
            Schedule Shift
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddAttendance(true)}
          >
            Add Attendance Entry
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search by Employee Name or Department"
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
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="on_leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={dateRangeFilter.start}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, start: e.target.value})}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={dateRangeFilter.end}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, end: e.target.value})}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Scheduled Shifts */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Scheduled Shifts</Typography>
          <DataTable
            data={scheduledShifts}
            loading={loading}
            columns={[
              { field: 'driver_id', headerName: 'Driver' },
              { field: 'department', headerName: 'Department' },
              { field: 'start_time', headerName: 'Start' },
              { field: 'end_time', headerName: 'End' },
              { field: 'repeat', headerName: 'Repeat' },
              { field: 'status', headerName: 'Status' },
            ]}
            rowActions={[
              { label: 'Edit', onClick: ({ row }) => openEditShift(row) },
              { label: 'Delete', onClick: ({ row }) => deleteShift(row) },
            ]}
            searchable
            pagination
            emptyMessage="No scheduled shifts found"
          />
        </CardContent>
      </Card>

      {/* Edit Shift Modal */}
      <Dialog open={editShiftOpen} onClose={() => setEditShiftOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Scheduled Shift</DialogTitle>
        <DialogContent>
          {editingShift ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Start" type="datetime-local" value={editingShift.start_time || ''} onChange={e => setEditingShift(s => ({ ...s, start_time: e.target.value }))} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="End" type="datetime-local" value={editingShift.end_time || ''} onChange={e => setEditingShift(s => ({ ...s, end_time: e.target.value }))} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Repeat" value={editingShift.repeat || ''} onChange={e => setEditingShift(s => ({ ...s, repeat: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Status" value={editingShift.status || ''} onChange={e => setEditingShift(s => ({ ...s, status: e.target.value }))} />
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditShiftOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEditShift}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Attendance Records</Typography>
          <DataTable
            data={filteredAttendance}
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
                field: 'check_in', 
                headerName: 'Date',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                  </Typography>
                )
              },
              { 
                field: 'check_in', 
                headerName: 'Check-in',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(params.value).toLocaleTimeString()}
                  </Typography>
                )
              },
              { 
                field: 'check_out', 
                headerName: 'Check-out',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value ? new Date(params.value).toLocaleTimeString() : 'N/A'}
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
                    color={params.value === 'present' ? 'success' : params.value === 'late' ? 'warning' : params.value === 'absent' ? 'error' : 'default'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Edit Attendance', icon: <EditIcon />, onClick: ({ row }) => handleEditAttendanceRecord(row) },
              { label: 'Notify Employee', icon: <NotificationsIcon />, onClick: ({ row }) => handleNotifyEmployee(row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Attendance Modal */}
      <Dialog open={showAddAttendance} onClose={() => setShowAddAttendance(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Attendance Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={attendanceForm.employee}
                  label="Employee"
                  onChange={(e) => setAttendanceForm({...attendanceForm, employee: e.target.value})}
                >
                  {staff.map(emp => (
                    <MenuItem key={emp.user_id} value={emp.user_id}>
                      {emp.name} ({emp.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Check-in Time"
                type="time"
                value={attendanceForm.checkInTime}
                onChange={(e) => setAttendanceForm({...attendanceForm, checkInTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Check-out Time"
                type="time"
                value={attendanceForm.checkOutTime}
                onChange={(e) => setAttendanceForm({...attendanceForm, checkOutTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={attendanceForm.status}
                  label="Status"
                  onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddAttendance(false)}>Cancel</Button>
          <Button onClick={handleAddAttendance} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Shift Modal */}
      <Dialog open={showScheduleShift} onClose={() => setShowScheduleShift(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={shiftForm.employee}
                  label="Employee"
                  onChange={(e) => {
                    const selectedEmp = staff.find(emp => emp.user_id === e.target.value);
                    setShiftForm({
                      ...shiftForm, 
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department"
                value={shiftForm.department}
                onChange={(e) => setShiftForm({...shiftForm, department: e.target.value})}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shift Start Time"
                type="time"
                value={shiftForm.shiftStartTime}
                onChange={(e) => setShiftForm({...shiftForm, shiftStartTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shift End Time"
                type="time"
                value={shiftForm.shiftEndTime}
                onChange={(e) => setShiftForm({...shiftForm, shiftEndTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Repeat</InputLabel>
                <Select
                  value={shiftForm.repeat}
                  label="Repeat"
                  onChange={(e) => setShiftForm({...shiftForm, repeat: e.target.value})}
                >
                  <MenuItem value="None">None</MenuItem>
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Weekly">Weekly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScheduleShift(false)}>Cancel</Button>
          <Button onClick={handleScheduleShift} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Attendance Modal */}
      <Dialog open={showEditAttendance} onClose={() => setShowEditAttendance(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={attendanceForm.employee}
                  label="Employee"
                  onChange={(e) => setAttendanceForm({...attendanceForm, employee: e.target.value})}
                  disabled
                >
                  {staff.map(emp => (
                    <MenuItem key={emp.user_id} value={emp.user_id}>
                      {emp.name} ({emp.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Check-in Time"
                type="time"
                value={attendanceForm.checkInTime}
                onChange={(e) => setAttendanceForm({...attendanceForm, checkInTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Check-out Time"
                type="time"
                value={attendanceForm.checkOutTime}
                onChange={(e) => setAttendanceForm({...attendanceForm, checkOutTime: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={attendanceForm.status}
                  label="Status"
                  onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditAttendance(false)}>Cancel</Button>
          <Button onClick={handleEditAttendance} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
