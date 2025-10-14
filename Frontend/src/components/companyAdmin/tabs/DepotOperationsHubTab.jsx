import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardContent, Typography, Grid, Box, Button, TextField, 
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Alert
} from '@mui/material';
import {
  Business as BusinessIcon, LocalShipping as TruckIcon, Assignment as TaskIcon,
  People as PeopleIcon, Schedule as ScheduleIcon, Assessment as ReportIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import DepotKPIs from '../components/DepotKPIs';
import TripTimeline from '../components/TripTimeline';
import StaffCoordinationTable from '../components/StaffCoordinationTable';
import DepotBusesTable from '../components/DepotBusesTable';
import DriversTable from '../components/DriversTable';
// import DepotTripsTable from '../components/DepotTripsTable'; // TODO: Implement depot trips table
import ShiftsTable from '../components/ShiftsTable';
import TasksTable from '../components/TasksTable';
import AssignModal from '../components/AssignModal';
import AddTaskModal from '../components/AddTaskModal';

export default function DepotOperationsHubTab() {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    shift: '',
    dateRange: 'today'
  });

  // Data states
  const [depotData, setDepotData] = useState({
    todayTrips: [],
    buses: [],
    drivers: [],
    trips: [],
    staff: [],
    shifts: [],
    tasks: []
  });

  // KPI metrics
  const [kpiMetrics, setKpiMetrics] = useState({
    totalTripsToday: 0,
    activeBuses: 0,
    activeDrivers: 0,
    staffOnShift: 0
  });

  const loadDepotData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get today's date range
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      // Load today's trips
      const { data: todayTripsData } = await supabase
        .from('trips')
        .select(`
          id,
          departure,
          arrival,
          status,
          bus:bus_id(name, license_plate),
          driver:driver_id(name),
          route:route_id(pick_up, drop_off)
        `)
        .eq('company_id', companyId)
        .gte('departure', startOfToday)
        .lte('departure', endOfToday)
        .order('departure', { ascending: true });

      // Load buses
      const { data: busesData } = await supabase
        .from('buses')
        .select('id, name, license_plate, capacity, status, type')
        .eq('company_id', companyId);

      // Load drivers (from staff with driver role)
      const { data: driversData } = await supabase
        .from('staff')
        .select('id, name, role, license_number, status')
        .eq('company_id', companyId)
        .eq('role', 'Driver');

      // Load all trips
      const { data: tripsData } = await supabase
        .from('trips')
        .select(`
          id,
          departure,
          arrival,
          status,
          bus:bus_id(name),
          driver:driver_id(name),
          route:route_id(pick_up, drop_off)
        `)
        .eq('company_id', companyId)
        .order('departure', { ascending: false })
        .limit(100);

      // Load staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, name, role, status, phone, email')
        .eq('company_id', companyId);

      // Mock shifts data (would come from shifts table)
      const shiftsData = [
        {
          id: 'shift_1',
          staff: { name: 'John Doe', role: 'Driver' },
          start_time: '06:00',
          end_time: '14:00',
          status: 'Active'
        },
        {
          id: 'shift_2',
          staff: { name: 'Jane Smith', role: 'Mechanic' },
          start_time: '14:00',
          end_time: '22:00',
          status: 'Scheduled'
        }
      ];

      // Mock tasks data (would come from tasks table)
      const tasksData = [
        {
          id: 'task_1',
          task_name: 'Bus Inspection',
          assigned_to: { name: 'Mike Johnson', role: 'Mechanic' },
          status: 'In Progress',
          due_date: new Date().toISOString()
        },
        {
          id: 'task_2',
          task_name: 'Route Planning',
          assigned_to: { name: 'Sarah Wilson', role: 'Supervisor' },
          status: 'Pending',
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setDepotData({
        todayTrips: todayTripsData || [],
        buses: busesData || [],
        drivers: driversData || [],
        trips: tripsData || [],
        staff: staffData || [],
        shifts: shiftsData,
        tasks: tasksData
      });

      calculateKPIs(todayTripsData, busesData, driversData, shiftsData);
    } catch (error) {
      console.error('Error loading depot data:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const calculateKPIs = (trips, buses, drivers, shifts) => {
    const totalTripsToday = trips?.length || 0;
    const activeBuses = buses?.filter(bus => bus.status === 'Active').length || 0;
    const activeDrivers = drivers?.filter(driver => driver.status === 'Active').length || 0;
    const staffOnShift = shifts?.filter(shift => shift.status === 'Active').length || 0;

    setKpiMetrics({
      totalTripsToday,
      activeBuses,
      activeDrivers,
      staffOnShift
    });
  };

  useEffect(() => {
    loadDepotData();
  }, [loadDepotData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleAssign = (type, item) => {
    setAssignmentType(type);
    setSelectedItem(item);
    setShowAssignModal(true);
  };

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignModal(false);
    setAssignmentType('');
    setSelectedItem(null);
    loadDepotData();
  };

  const handleTaskAdded = () => {
    setShowAddTaskModal(false);
    loadDepotData();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Depot Operations
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDepotData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTask}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                placeholder="Search by name, ID, or route..."
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  label="Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="Driver">Driver</MenuItem>
                  <MenuItem value="Mechanic">Mechanic</MenuItem>
                  <MenuItem value="Supervisor">Supervisor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPIs */}
      <DepotKPIs metrics={kpiMetrics} loading={loading} />

      {/* Tabs for different sections */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Today's Trips" />
            <Tab label="Staff & Shifts" />
            <Tab label="Fleet Management" />
            <Tab label="Tasks" />
          </Tabs>
        </Box>

        {/* Today's Trips Tab */}
        {tabValue === 0 && (
          <CardContent>
            <TripTimeline 
              trips={depotData.todayTrips} 
              loading={loading}
              onAssign={handleAssign}
            />
          </CardContent>
        )}

        {/* Staff & Shifts Tab */}
        {tabValue === 1 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <StaffCoordinationTable 
                  staff={depotData.staff} 
                  loading={loading}
                  filters={filters}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ShiftsTable 
                  shifts={depotData.shifts} 
                  loading={loading}
                />
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Fleet Management Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <DepotBusesTable 
                  buses={depotData.buses} 
                  loading={loading}
                  onAssign={handleAssign}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <DriversTable 
                  drivers={depotData.drivers} 
                  loading={loading}
                  onAssign={handleAssign}
                />
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Tasks Tab */}
        {tabValue === 3 && (
          <CardContent>
            <TasksTable 
              tasks={depotData.tasks} 
              loading={loading}
            />
          </CardContent>
        )}
      </Card>

      {/* Assignment Modal */}
      <AssignModal
        open={showAssignModal}
        type={assignmentType}
        item={selectedItem}
        onClose={() => setShowAssignModal(false)}
        onComplete={handleAssignmentComplete}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAddTaskModal}
        staff={depotData.staff}
        onClose={() => setShowAddTaskModal(false)}
        onComplete={handleTaskAdded}
      />
    </Box>
  );
}
