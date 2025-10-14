import React, { useEffect, useState } from 'react';
import { Grid, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, Card, CardContent, Typography, Chip, IconButton, Avatar, FormControl, InputLabel } from '@mui/material';
import { DirectionsBus as BusIcon, CheckCircle as CheckCircleIcon, Build as BuildIcon, Search as SearchIcon, Schedule as ScheduleIcon, PersonAdd as PersonAddIcon, Assessment as AssessmentIcon, Notifications as NotificationsIcon, AccessTime as TimeIcon, LocalGasStation as FuelIcon, Engineering as EngineeringIcon, Construction as ConstructionIcon, Warning as WarningIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import DashboardCard, { StatsCard, QuickActionCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import CommandCenterMap from '../../companyAdmin/tabs/CommandCenterMap';
import { supabase } from '../../../supabase/client';
import { upsertMaintenanceLog } from '../../../supabase/api';

export default function CommandCenterTab() {
  const [kpis, setKpis] = useState({ fleet: 0, operation: 0, maintenance: 0, inspection: 0, tasksDone: 0, tasksPending: 0, downtimeHrs: 0, staffUtil: 0, baysBusy: 0, fuelingToday: 0 });
  const [alerts, setAlerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [buses, setBuses] = useState([]);
  const [staff, setStaff] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [showScheduleMaintenance, setShowScheduleMaintenance] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showGenerateReport, setShowGenerateReport] = useState(false);
  
  // Form states
  const [taskForm, setTaskForm] = useState({
    bus_id: '',
    title: '',
    priority: 'medium',
    notes: '',
    staff_id: '',
    dueDate: ''
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    bus_id: '',
    maintenanceType: '',
    date: '',
    workshopBay: ''
  });
  
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'maintenance_tech',
    contact: '',
    status: 'Active'
  });
  
  const [reportForm, setReportForm] = useState({
    reportType: 'daily',
    filters: {
      bus: '',
      taskStatus: '',
      staff: ''
    }
  });

  const load = async () => {
    const start = new Date(); start.setHours(0,0,0,0); const end = new Date(); end.setHours(23,59,59,999);
    const [{ data: busesData }, { data: maintTasks }, { data: repairs }, { data: staffTasks }, { data: inv }, { data: bays }, { data: fuelToday }, { data: staffList }] = await Promise.all([
      supabase.from('buses').select('bus_id, license_plate, status').eq('company_id', companyId),
      supabase.from('maintenance_tasks').select('id, status, priority').eq('company_id', companyId),
      supabase.from('repair_logs').select('duration_hours').eq('company_id', companyId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('staff_tasks').select('status, hours').eq('company_id', companyId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('inventory').select('item, quantity, min_threshold').eq('company_id', companyId),
      supabase.from('workshop_jobs').select('id, ended_at').eq('company_id', companyId).is('ended_at', null),
      supabase.from('fuel_logs').select('id').eq('company_id', companyId).gte('filled_at', start.toISOString()).lte('filled_at', end.toISOString()),
      supabase.from('users').select('user_id, name, role').eq('company_id', companyId).in('role', ['maintenance_tech','maintenance_manager'])
    ]);
    setBuses(busesData||[]);
    setStaff(staffList||[]);
    const fleet = (busesData||[]).length;
    const operation = (busesData||[]).filter(b => (b.status||'').toLowerCase().includes('active') || (b.status||'').toLowerCase().includes('operation')).length;
    const maintenance = (busesData||[]).filter(b => (b.status||'').toLowerCase().includes('maintenance') || (b.status||'').toLowerCase().includes('repair')).length;
    const inspection = (busesData||[]).filter(b => (b.status||'').toLowerCase().includes('inspection')).length;
    const tasksDone = (maintTasks||[]).filter(t => (t.status||'').toLowerCase()==='completed').length;
    const tasksPending = (maintTasks||[]).filter(t => (t.status||'').toLowerCase()!=='completed').length;
    const downtimeHrs = (repairs||[]).reduce((s,x)=> s + Number(x.duration_hours||0), 0);
    const hoursWorked = (staffTasks||[]).reduce((s,x)=> s + Number(x.hours||0), 0);
    const staffUtil = Math.min(100, Math.round((hoursWorked / Math.max(1, (staffTasks||[]).length*8)) * 100));
    const baysBusy = (bays||[]).length;
    const fuelingToday = (fuelToday||[]).length;
    const newKpis = { fleet, operation, maintenance, inspection, tasksDone, tasksPending, downtimeHrs, staffUtil, baysBusy, fuelingToday };
    setKpis(newKpis);
    try { await supabase.from('maintenance_kpis_daily').upsert([{ company_id: companyId, kpi_date: start.toISOString().slice(0,10), ...newKpis }], { onConflict: 'company_id,kpi_date' }); } catch {}
    const lowStock = (inv||[]).filter(x => Number(x.quantity||0) <= Number(x.min_threshold||0));
    const als = [];
    if (maintenance > 0) als.push({ created_at: new Date().toISOString(), type: 'maintenance', message: `${maintenance} buses under maintenance` });
    if ((lowStock||[]).length > 0) als.push({ created_at: new Date().toISOString(), type: 'inventory', message: `${lowStock.length} items below threshold` });
    setAlerts(als);
    setTasks((maintTasks||[]).slice(0, 20));
  };

  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [companyId]);

  const handleAssignTask = async () => {
    try {
      if (!taskForm.bus_id || !taskForm.title) return;
      await supabase.from('maintenance_tasks').insert([{
        company_id: companyId,
        bus_id: taskForm.bus_id,
        title: taskForm.title,
        priority: taskForm.priority,
        status: 'pending',
        notes: taskForm.notes || null,
        due_date: taskForm.dueDate || null
      }]);
      setShowAssignTask(false);
      setTaskForm({ bus_id: '', title: '', priority: 'medium', notes: '', staff_id: '', dueDate: '' });
      load();
    } catch (error) { console.warn('Load error:', error); }
  };

  const handleScheduleMaintenance = async () => {
    try {
      if (!scheduleForm.bus_id || !scheduleForm.maintenanceType) return;
      await supabase.from('maintenance_schedule').insert([{
        company_id: companyId,
        bus_id: scheduleForm.bus_id,
        maintenance_type: scheduleForm.maintenanceType,
        scheduled_date: scheduleForm.date,
        workshop_bay: scheduleForm.workshopBay
      }]);
      setShowScheduleMaintenance(false);
      setScheduleForm({ bus_id: '', maintenanceType: '', date: '', workshopBay: '' });
      load();
    } catch (error) { console.warn('Load error:', error); }
  };

  const handleAddStaff = async () => {
    try {
      if (!staffForm.name || !staffForm.email) return;
      await supabase.from('users').insert([{
        company_id: companyId,
        name: staffForm.name,
        email: staffForm.email,
        role: staffForm.role,
        phone: staffForm.contact,
        is_active: staffForm.status === 'Active'
      }]);
      setShowAddStaff(false);
      setStaffForm({ name: '', email: '', role: 'maintenance_tech', contact: '', status: 'Active' });
      load();
    } catch (error) { console.warn('Load error:', error); }
  };

  const handleGenerateReport = async () => {
    try {
      await supabase.from('reports_queue').insert([{
        company_id: companyId,
        type: reportForm.reportType + '_report',
        params: reportForm.filters
      }]);
      alert('Report generation queued');
      setShowGenerateReport(false);
    } catch (error) { console.warn('Load error:', error); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Maintenance Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton>
            <NotificationsIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Live Fleet Map - Optional, can be toggled */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Live Fleet Map</Typography>
          <CommandCenterMap />
        </CardContent>
      </Card>

      {/* Top KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <BusIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary" fontWeight="bold">
                {kpis.fleet}
              </Typography>
              <Typography variant="body2" color="text.secondary">Fleet</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {kpis.operation}
              </Typography>
              <Typography variant="body2" color="text.secondary">In Operation</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <BuildIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {kpis.maintenance}
              </Typography>
              <Typography variant="body2" color="text.secondary">Under Maintenance</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <SearchIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {kpis.inspection}
              </Typography>
              <Typography variant="body2" color="text.secondary">Awaiting Inspection</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
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
                {kpis.tasksDone}
              </Typography>
              <Typography variant="body2" color="text.secondary">Tasks Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {kpis.tasksPending}
              </Typography>
              <Typography variant="body2" color="text.secondary">Tasks Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <TimeIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {kpis.downtimeHrs}
              </Typography>
              <Typography variant="body2" color="text.secondary">Downtime (hrs)</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <EngineeringIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary" fontWeight="bold">
                {kpis.staffUtil}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Staff Utilization</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <ConstructionIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" color="secondary.main" fontWeight="bold">
                {kpis.baysBusy}
              </Typography>
              <Typography variant="body2" color="text.secondary">Workshop Bays Busy</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <FuelIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {kpis.fuelingToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">Fuel Logs Today</Typography>
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
            onClick={() => setShowAssignTask(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Assign Task
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assign maintenance tasks to staff
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
              <ScheduleIcon sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Schedule Maintenance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plan routine maintenance
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
            onClick={() => setShowAddStaff(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PersonAddIcon sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Add Staff
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add maintenance staff
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
            onClick={() => setShowGenerateReport(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Generate Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate maintenance reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tables */}
      <Grid container spacing={3}>
        {/* Notifications & Alerts */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Notifications & Alerts</Typography>
              <DataTable
                data={alerts}
                loading={false}
                columns={[
                  { 
                    field: 'created_at', 
                    headerName: 'Date', 
                    type: 'date',
                    renderCell: (params) => (
                      <Typography variant="body2">
                        {new Date(params.value).toLocaleDateString()}
                      </Typography>
                    )
                  },
                  { 
                    field: 'type', 
                    headerName: 'Target',
                    renderCell: (params) => (
                      <Chip 
                        label={params.value} 
                        size="small" 
                        color={params.value === 'maintenance' ? 'warning' : 'info'}
                      />
                    )
                  },
                  { 
                    field: 'message', 
                    headerName: 'Title',
                    renderCell: (params) => (
                      <Typography variant="body2" fontWeight="medium">
                        {params.value}
                      </Typography>
                    )
                  },
                  { 
                    field: 'status', 
                    headerName: 'Status',
                    renderCell: (params) => (
                      <Chip 
                        label="Active" 
                        size="small" 
                        color="success"
                      />
                    )
                  }
                ]}
                rowActions={[
                  { label: 'View', icon: <AssessmentIcon />, onClick: ({ row }) => console.log('View', row) },
                  { label: 'Acknowledge', icon: <CheckCircleIcon />, onClick: ({ row }) => console.log('Acknowledge', row) },
                  { label: 'Dismiss', icon: <WarningIcon />, onClick: ({ row }) => console.log('Dismiss', row) }
                ]}
                searchable
                pagination
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Maintenance Tasks */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Maintenance Tasks</Typography>
              <DataTable
                data={tasks}
                loading={false}
                columns={[
                  { 
                    field: 'bus_id', 
                    headerName: 'Bus',
                    renderCell: (params) => {
                      const bus = buses.find(b => b.bus_id === params.value);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {bus?.license_plate || params.value}
                          </Typography>
                        </Box>
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
                    field: 'assigned_to', 
                    headerName: 'Assignee',
                    renderCell: (params) => {
                      const staffMember = staff.find(s => s.user_id === params.value);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {staffMember?.name?.charAt(0)?.toUpperCase() || '?'}
                          </Avatar>
                          <Typography variant="body2">
                            {staffMember?.name || 'Unassigned'}
                          </Typography>
                        </Box>
                      );
                    }
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
                  },
                  { 
                    field: 'created_at', 
                    headerName: 'Start Date',
                    renderCell: (params) => (
                      <Typography variant="body2" color="text.secondary">
                        {new Date(params.value).toLocaleDateString()}
                      </Typography>
                    )
                  },
                  { 
                    field: 'due_date', 
                    headerName: 'End Date',
                    renderCell: (params) => (
                      <Typography variant="body2" color="text.secondary">
                        {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
                      </Typography>
                    )
                  }
                ]}
                rowActions={[
                  { label: 'Edit', icon: <AssessmentIcon />, onClick: ({ row }) => console.log('Edit', row) },
                  { label: 'Complete', icon: <CheckCircleIcon />, onClick: ({ row }) => console.log('Complete', row) },
                  { label: 'Cancel', icon: <WarningIcon />, onClick: ({ row }) => console.log('Cancel', row) }
                ]}
                searchable
                pagination
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assign Task Modal */}
      <Dialog open={showAssignTask} onClose={() => setShowAssignTask(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Task</DialogTitle>
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
                  value={taskForm.staff_id}
                  label="Assignee"
                  onChange={(e) => setTaskForm({...taskForm, staff_id: e.target.value})}
                >
                  <MenuItem value="">Unassigned</MenuItem>
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

      {/* Schedule Maintenance Modal */}
      <Dialog open={showScheduleMaintenance} onClose={() => setShowScheduleMaintenance(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Bus/Vehicle</InputLabel>
                <Select
                  value={scheduleForm.bus_id}
                  label="Bus/Vehicle"
                  onChange={(e) => setScheduleForm({...scheduleForm, bus_id: e.target.value})}
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
              <FormControl fullWidth>
                <InputLabel>Maintenance Type</InputLabel>
                <Select
                  value={scheduleForm.maintenanceType}
                  label="Maintenance Type"
                  onChange={(e) => setScheduleForm({...scheduleForm, maintenanceType: e.target.value})}
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="preventive">Preventive</MenuItem>
                  <MenuItem value="inspection">Inspection</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Workshop Bay"
                value={scheduleForm.workshopBay}
                onChange={(e) => setScheduleForm({...scheduleForm, workshopBay: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScheduleMaintenance(false)}>Cancel</Button>
          <Button onClick={handleScheduleMaintenance} variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>

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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact"
                value={staffForm.contact}
                onChange={(e) => setStaffForm({...staffForm, contact: e.target.value})}
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
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
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

      {/* Generate Report Modal */}
      <Dialog open={showGenerateReport} onClose={() => setShowGenerateReport(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportForm.reportType}
                  label="Report Type"
                  onChange={(e) => setReportForm({...reportForm, reportType: e.target.value})}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Bus Filter</InputLabel>
                <Select
                  value={reportForm.filters.bus}
                  label="Bus Filter"
                  onChange={(e) => setReportForm({...reportForm, filters: {...reportForm.filters, bus: e.target.value}})}
                >
                  <MenuItem value="">All Buses</MenuItem>
                  {buses.map(b => (
                    <MenuItem key={b.bus_id} value={b.bus_id}>
                      {b.license_plate}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Task Status</InputLabel>
                <Select
                  value={reportForm.filters.taskStatus}
                  label="Task Status"
                  onChange={(e) => setReportForm({...reportForm, filters: {...reportForm.filters, taskStatus: e.target.value}})}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Staff Filter</InputLabel>
                <Select
                  value={reportForm.filters.staff}
                  label="Staff Filter"
                  onChange={(e) => setReportForm({...reportForm, filters: {...reportForm.filters, staff: e.target.value}})}
                >
                  <MenuItem value="">All Staff</MenuItem>
                  {staff.map(s => (
                    <MenuItem key={s.user_id} value={s.user_id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateReport(false)}>Cancel</Button>
          <Button onClick={handleGenerateReport} variant="contained">Generate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
