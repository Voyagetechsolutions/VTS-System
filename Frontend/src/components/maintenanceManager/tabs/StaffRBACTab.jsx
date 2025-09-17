import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, Person as PersonIcon, Security as SecurityIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function StaffRBACTab() {
  const [staff, setStaff] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Form states
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'maintenance_tech',
    department: 'Maintenance',
    contact: '',
    status: 'Active'
  });
  
  const [taskForm, setTaskForm] = useState({
    bus_id: '',
    title: '',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    notes: ''
  });
  
  // Permissions state
  const [permissions, setPermissions] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: staffData }, { data: tasksData }, { data: busesData }] = await Promise.all([
        supabase
          .from('users')
          .select('user_id, name, email, role, department, phone, is_active')
          .eq('company_id', companyId)
          .in('role', ['maintenance_tech', 'maintenance_manager', 'mechanic', 'cleaner', 'specialist', 'inspector', 'inventory', 'trainee', 'supervisor']),
        supabase
          .from('maintenance_tasks')
          .select(`
            id, bus_id, title, priority, status, assigned_to, due_date, created_at,
            users!inner(name)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('buses')
          .select('bus_id, license_plate, status')
          .eq('company_id', companyId)
      ]);
      
      // Transform tasks data to include assignee names
      const transformedTasks = (tasksData || []).map(task => ({
        ...task,
        assignee: task.users?.name || 'Unassigned'
      }));
      
      setStaff(staffData || []);
      setTasks(transformedTasks);
      setBuses(busesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleAddStaff = async () => {
    try {
      if (!staffForm.name || !staffForm.email) return;
      await supabase.from('users').insert([{
        company_id: companyId,
        name: staffForm.name,
        email: staffForm.email.toLowerCase(),
        role: staffForm.role,
        department: staffForm.department,
        phone: staffForm.contact,
        is_active: staffForm.status === 'Active'
      }]);
      setShowAddStaff(false);
      setStaffForm({
        name: '',
        email: '',
        role: 'maintenance_tech',
        department: 'Maintenance',
        contact: '',
        status: 'Active'
      });
      loadData();
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const handleAssignTask = async () => {
    try {
      if (!taskForm.bus_id || !taskForm.title || !taskForm.assignee) return;
      await supabase.from('maintenance_tasks').insert([{
        company_id: companyId,
        bus_id: taskForm.bus_id,
        title: taskForm.title,
        priority: taskForm.priority,
        status: 'pending',
        assigned_to: taskForm.assignee,
        due_date: taskForm.dueDate || null,
        notes: taskForm.notes || null
      }]);
      setShowAssignTask(false);
      setTaskForm({
        bus_id: '',
        title: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleTogglePermission = (userId, permission) => {
    setPermissions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [permission]: !prev[userId]?.[permission]
      }
    }));
  };

  const handleSavePermissions = async () => {
    try {
      const rows = Object.entries(permissions).flatMap(([userId, perms]) => 
        Object.entries(perms).map(([permission, canAccess]) => ({
          user_id: userId,
          module: permission,
          can_view: canAccess,
          company_id: companyId
        }))
      );
      
      if (rows.length > 0) {
      await supabase.from('maintenance_permissions').upsert(rows, { onConflict: 'user_id,module' });
        alert('Permissions saved successfully!');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  };

  const permissionModules = [
    'Can Assign Task',
    'Can Complete Task', 
    'Can Schedule Maintenance',
    'Can View Reports',
    'Can Manage Inventory',
    'Can Update Fleet'
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Staff Management & RBAC
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddStaff(true)}
        >
          Add Staff
        </Button>
      </Box>

      {/* Staff Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Staff Table</Typography>
          <DataTable
            data={staff}
            loading={loading}
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
                    color={params.value === 'maintenance_manager' ? 'primary' : params.value === 'maintenance_tech' ? 'secondary' : 'default'}
                  />
                )
              },
              { 
                field: 'department', 
                headerName: 'Department',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value || 'Maintenance'}
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
              }
            ]}
            rowActions={[
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'View Profile', icon: <VisibilityIcon />, onClick: ({ row }) => console.log('View', row) },
              { label: 'Deactivate', icon: <PersonIcon />, onClick: ({ row }) => console.log('Deactivate', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Permissions Matrix</Typography>
            <Button variant="contained" onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  {permissionModules.map(module => (
                    <TableCell key={module} align="center">
                      {module}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map(member => (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {member.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">
                          {member.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    {permissionModules.map(module => (
                      <TableCell key={module} align="center">
                        <Switch
                          checked={permissions[member.user_id]?.[module] || false}
                          onChange={() => handleTogglePermission(member.user_id, module)}
                          size="small"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Tasks Table</Typography>
            <Button
              variant="contained"
              startIcon={<AssignmentIcon />}
              onClick={() => setShowAssignTask(true)}
            >
              Quick Assign Task
            </Button>
          </Box>
          <DataTable
            data={tasks}
            loading={loading}
            columns={[
              { 
                field: 'bus_id', 
                headerName: 'Bus',
                renderCell: (params) => {
                  const bus = buses.find(b => b.bus_id === params.value);
                  return (
                    <Typography variant="body2">
                      {bus?.license_plate || params.value}
                    </Typography>
                  );
                }
              },
              { 
                field: 'title', 
                headerName: 'Task Type',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="medium">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'assignee', 
                headerName: 'Assignee',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {params.value?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">
                      {params.value}
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
                    color={params.value === 'completed' ? 'success' : params.value === 'pending' ? 'warning' : 'default'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'Complete', icon: <AssignmentIcon />, onClick: ({ row }) => console.log('Complete', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Dialog open={showAddStaff} onClose={() => setShowAddStaff(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Staff</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={staffForm.name}
                onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={staffForm.role}
                  label="Role"
                  onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                >
                  <MenuItem value="maintenance_tech">Maintenance Tech</MenuItem>
                  <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
                  <MenuItem value="mechanic">Mechanic</MenuItem>
                  <MenuItem value="cleaner">Cleaner</MenuItem>
                  <MenuItem value="specialist">Specialist</MenuItem>
                  <MenuItem value="inspector">Inspector</MenuItem>
                  <MenuItem value="inventory">Inventory</MenuItem>
                  <MenuItem value="trainee">Trainee</MenuItem>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={staffForm.department}
                  label="Department"
                  onChange={(e) => setStaffForm({...staffForm, department: e.target.value})}
                >
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Quality Control">Quality Control</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact"
                value={staffForm.contact}
                onChange={(e) => setStaffForm({...staffForm, contact: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={staffForm.status}
                  label="Status"
                  onChange={(e) => setStaffForm({...staffForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddStaff(false)}>Cancel</Button>
          <Button onClick={handleAddStaff} variant="contained">Add Staff</Button>
        </DialogActions>
      </Dialog>

      {/* Quick Assign Task Modal */}
      <Dialog open={showAssignTask} onClose={() => setShowAssignTask(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quick Assign Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Bus/Vehicle</InputLabel>
                <Select
                  value={taskForm.bus_id}
                  label="Bus/Vehicle"
                  onChange={(e) => setTaskForm({...taskForm, bus_id: e.target.value})}
                >
                  <MenuItem value="">Select Bus...</MenuItem>
                  {buses.map(b => (
                    <MenuItem key={b.bus_id} value={b.bus_id}>
                      {b.license_plate}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Type"
                value={taskForm.title}
                onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  label="Priority"
                  onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={taskForm.assignee}
                  label="Assignee"
                  onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}
                >
                  <MenuItem value="">Select Staff...</MenuItem>
                  {staff.map(s => (
                    <MenuItem key={s.user_id} value={s.user_id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={taskForm.notes}
                onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignTask(false)}>Cancel</Button>
          <Button onClick={handleAssignTask} variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
