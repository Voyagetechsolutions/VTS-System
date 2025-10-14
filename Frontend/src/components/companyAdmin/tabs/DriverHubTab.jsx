import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DashboardCard, { StatsCard } from '../../common/DashboardCard';
import PieChart from '../../charts/PieChart';
import BarChart from '../../charts/BarChart';
import DataTable from '../../common/DataTable';
import {
  getDrivers,
  updateDriver,
  suspendDriver,
  assignDriver,
  listDriverTraining,
  upsertDriverTraining,
  listDriverKPIs,
  listDriverShifts,
  upsertDriverShift,
  getCompanyRoutes,
} from '../../../supabase/api';
import { useSnackbar } from 'notistack';

const driverStatusColor = (status) => {
  if ((status || '').toLowerCase() === 'active') return 'success';
  if ((status || '').toLowerCase() === 'suspended') return 'error';
  return 'warning';
};

const shiftStatusColor = (status) => {
  if (status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'error';
  return 'info';
};

const trainingStatusColor = (status) => {
  if (status === 'Completed') return 'success';
  if (status === 'In Progress') return 'info';
  return 'warning';
};

const tabs = ['Drivers', 'Shifts', 'Training', 'Performance'];

export default function DriverHubTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [shifts, setShifts] = useState([]);
  const [shiftSearch, setShiftSearch] = useState('');
  const [training, setTraining] = useState([]);
  const [trainingFilters, setTrainingFilters] = useState({ driver: '', status: '' });
  const [performance, setPerformance] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [newShift, setNewShift] = useState({ driver_id: '', route_id: '', start_time: '', end_time: '', status: 'Scheduled' });
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [savingTraining, setSavingTraining] = useState(false);
  const [newTraining, setNewTraining] = useState({ driver_id: '', course: '', status: 'Pending' });
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({ name: '', email: '', phone: '', license_number: '', status: 'Pending' });
  const [driverSaving, setDriverSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [driversResp, shiftsResp, trainingResp, performanceResp, routesResp] = await Promise.all([
        getDrivers(),
        listDriverShifts(),
        listDriverTraining(),
        listDriverKPIs(),
        getCompanyRoutes(),
      ]);
      setDrivers(driversResp.data || []);
      setFilteredDrivers(driversResp.data || []);
      setShifts(shiftsResp.data || []);
      setTraining(trainingResp.data || []);
      setPerformance(performanceResp.data || []);
      setRoutes(routesResp.data || []);
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to load driver hub data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const search = driverSearch.trim().toLowerCase();
    setFilteredDrivers((drivers || []).filter((driver) => {
      if (!search) return true;
      return (
        (driver.name || '').toLowerCase().includes(search) ||
        (driver.email || '').toLowerCase().includes(search)
      );
    }));
  }, [driverSearch, drivers]);

  const stats = useMemo(() => {
    // Unused function - keeping for future use
    // const assignDriver = async (driverId, routeId) => {
    const today = new Date().toISOString().slice(0, 10);
    const shiftsToday = (shifts || []).filter((s) => (s.start_time || '').slice(0, 10) === today).length;
    const trainingCompletePct = (() => {
      const total = training.length;
      if (!total) return 0;
      const completed = training.filter((t) => t.status === 'Completed').length;
      return Math.round((completed / total) * 100);
    })();
    const avgOnTime = (() => {
      const metrics = performance.filter((kpi) => typeof kpi.on_time_percent === 'number');
      if (!metrics.length) return 0;
      return Math.round(metrics.reduce((sum, kpi) => sum + Number(kpi.on_time_percent || 0), 0) / metrics.length);
    })();
    return {
      activeDrivers: (drivers || []).filter((d) => (d.status || '').toLowerCase() === 'active').length,
      shiftsToday,
      trainingCompletePct,
      avgOnTime,
    };
  }, [drivers, shifts, training, performance]);

  const handleSaveShift = async () => {
    if (!newShift.driver_id || !newShift.start_time || !newShift.end_time) {
      enqueueSnackbar('Driver, start, and end time are required for a shift', { variant: 'warning' });
      return;
    }
    setSavingShift(true);
    try {
      const payload = {
        driver_id: newShift.driver_id,
        route_id: newShift.route_id || null,
        start_time: newShift.start_time,
        end_time: newShift.end_time,
        status: newShift.status,
      };
      const { error } = await upsertDriverShift(payload);
      if (error) throw error;
      enqueueSnackbar('Shift saved', { variant: 'success' });
      setShiftDialogOpen(false);
      setNewShift({ driver_id: '', route_id: '', start_time: '', end_time: '', status: 'Scheduled' });
      loadData();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to save shift', { variant: 'error' });
    } finally {
      setSavingShift(false);
    }
  };

  const handleSaveTraining = async () => {
    if (!newTraining.driver_id || !newTraining.course.trim()) {
      enqueueSnackbar('Driver and course are required for training assignment', { variant: 'warning' });
      return;
    }
    setSavingTraining(true);
    try {
      const payload = {
        driver_id: newTraining.driver_id,
        course: newTraining.course.trim(),
        status: newTraining.status,
      };
      const { error } = await upsertDriverTraining(payload);
      if (error) throw error;
      enqueueSnackbar('Training updated', { variant: 'success' });
      setTrainingDialogOpen(false);
      setNewTraining({ driver_id: '', course: '', status: 'Pending' });
      loadData();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to assign training', { variant: 'error' });
    } finally {
      setSavingTraining(false);
    }
  };

  const handleDriverSubmit = async () => {
    if (!driverForm.name.trim() || !driverForm.license_number.trim()) {
      enqueueSnackbar('Name and license number are required', { variant: 'warning' });
      return;
    }
    setDriverSaving(true);
    try {
      const payload = {
        name: driverForm.name.trim(),
        email: driverForm.email?.trim().toLowerCase() || null,
        phone: driverForm.phone?.trim() || null,
        license_number: driverForm.license_number.trim(),
        status: driverForm.status,
      };
      if (editingDriver?.driver_id) {
        const { error } = await updateDriver(editingDriver.driver_id, payload);
        if (error) throw error;
        enqueueSnackbar('Driver updated', { variant: 'success' });
      } else {
        // create driver is not exposed in prompt but available in API file
        const { error } = await updateDriver(null, payload);
        if (error) throw error;
        enqueueSnackbar('Driver created', { variant: 'success' });
      }
      setDriverDialogOpen(false);
      setEditingDriver(null);
      setDriverForm({ name: '', email: '', phone: '', license_number: '', status: 'Pending' });
      loadData();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to save driver', { variant: 'error' });
    } finally {
      setDriverSaving(false);
    }
  };

  const trainingStats = useMemo(() => {
    const total = training.length;
    const completed = training.filter((item) => item.status === 'Completed').length;
    return [
      { label: 'Completed', value: completed },
      { label: 'Remaining', value: Math.max(total - completed, 0) },
    ];
  }, [training]);

  const topDrivers = useMemo(() => {
    return (performance || [])
      .map((item) => ({ label: item.driver_name || String(item.driver_id || '').slice(0, 6), value: Number(item.trips_completed || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [performance]);

  const filteredShifts = useMemo(() => {
    const search = shiftSearch.trim().toLowerCase();
    return (shifts || []).filter((shift) => {
      if (!search) return true;
      const driver = (drivers || []).find((d) => d.driver_id === shift.driver_id);
      const driverName = driver?.name?.toLowerCase() || '';
      const route = routes.find((r) => r.route_id === shift.route_id);
      const routeName = route ? `${route.origin || ''} - ${route.destination || ''}`.toLowerCase() : '';
      return driverName.includes(search) || routeName.includes(search) || (shift.status || '').toLowerCase().includes(search);
    });
  }, [shiftSearch, shifts, drivers, routes]);

  const filteredTraining = useMemo(() => {
    return (training || []).filter((item) => {
      const matchDriver = !trainingFilters.driver || item.driver_id === trainingFilters.driver;
      const matchStatus = !trainingFilters.status || item.status === trainingFilters.status;
      return matchDriver && matchStatus;
    });
  }, [training, trainingFilters]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard title="Drivers Active" value={stats.activeDrivers} icon="directions_bus" color="primary" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard title="Shifts Today" value={stats.shiftsToday} icon="event" color="info" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard title="Training Complete" value={`${stats.trainingCompletePct}%`} icon="school" color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard title="Avg On-time %" value={`${stats.avgOnTime}%`} icon="trending_up" color="secondary" />
          </Grid>
        </Grid>
      </Grid>

      {loading && (
        <Grid item xs={12}>
          <LinearProgress />
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <DashboardCard title="Training Completion" variant="outlined">
          <PieChart data={trainingStats} />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Top Drivers by Trips" variant="outlined">
          <BarChart data={topDrivers} />
        </DashboardCard>
      </Grid>

      <Grid item xs={12}>
        <DashboardCard
          title="Driver Hub"
          variant="outlined"
          headerAction={(
            <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
              {tabs.map((tab) => (
                <Tab key={tab} label={tab} />
              ))}
            </Tabs>
          )}
        >
          {activeTab === 0 && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <TextField
                  label="Search Drivers"
                  value={driverSearch}
                  onChange={(event) => setDriverSearch(event.target.value)}
                  fullWidth
                />
                <Box>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => {
                      setEditingDriver(null);
                      setDriverForm({ name: '', email: '', phone: '', license_number: '', status: 'Pending' });
                      setDriverDialogOpen(true);
                    }}
                  >
                    Add Driver
                  </Button>
                </Box>
              </Stack>
              <DataTable
                data={filteredDrivers}
                columns={[
                  { field: 'name', headerName: 'Driver Name' },
                  { field: 'email', headerName: 'Email' },
                  { field: 'phone', headerName: 'Phone' },
                  { field: 'license_number', headerName: 'License No.' },
                  {
                    field: 'status',
                    headerName: 'Status',
                    renderCell: (row) => <Chip size="small" color={driverStatusColor(row.status)} label={row.status || 'Pending'} />,
                  },
                  {
                    field: 'actions',
                    headerName: 'Actions',
                    renderCell: (row) => (
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingDriver(row);
                            setDriverForm({
                              name: row.name || '',
                              email: row.email || '',
                              phone: row.phone || '',
                              license_number: row.license_number || '',
                              status: row.status || 'Pending',
                            });
                            setDriverDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            try {
                              await suspendDriver(row.driver_id);
                              enqueueSnackbar('Driver suspended', { variant: 'info' });
                              loadData();
                            } catch (error) {
                              enqueueSnackbar(error?.message || 'Failed to suspend driver', { variant: 'error' });
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ),
                  },
                ]}
                pagination
                searchable={false}
              />
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <TextField
                  label="Search by driver, route, or status"
                  value={shiftSearch}
                  onChange={(event) => setShiftSearch(event.target.value)}
                  fullWidth
                />
                <Button startIcon={<AddIcon />} variant="contained" onClick={() => setShiftDialogOpen(true)}>
                  Add Shift
                </Button>
              </Stack>
              <DataTable
                data={filteredShifts}
                columns={[
                  {
                    field: 'driver_id',
                    headerName: 'Driver',
                    renderCell: (row) => (drivers.find((d) => d.driver_id === row.driver_id)?.name || '-')
                  },
                  {
                    field: 'route_id',
                    headerName: 'Route',
                    renderCell: (row) => {
                      const route = routes.find((r) => r.route_id === row.route_id);
                      return route ? `${route.origin || ''} → ${route.destination || ''}` : '-';
                    },
                  },
                  { field: 'start_time', headerName: 'Start', renderCell: (row) => new Date(row.start_time).toLocaleString() },
                  { field: 'end_time', headerName: 'End', renderCell: (row) => new Date(row.end_time).toLocaleString() },
                  {
                    field: 'status',
                    headerName: 'Status',
                    renderCell: (row) => <Chip size="small" color={shiftStatusColor(row.status)} label={row.status || 'Scheduled'} />,
                  },
                ]}
                pagination
                searchable={false}
              />
            </Stack>
          )}

          {activeTab === 2 && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flex={1}>
                  <FormControl fullWidth>
                    <InputLabel id="training-driver-label">Driver</InputLabel>
                    <Select
                      labelId="training-driver-label"
                      label="Driver"
                      value={trainingFilters.driver}
                      onChange={(event) => setTrainingFilters((prev) => ({ ...prev, driver: event.target.value }))}
                    >
                      <MenuItem value="">All drivers</MenuItem>
                      {(drivers || []).map((driver) => (
                        <MenuItem key={driver.driver_id} value={driver.driver_id}>{driver.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="training-status-label">Status</InputLabel>
                    <Select
                      labelId="training-status-label"
                      label="Status"
                      value={trainingFilters.status}
                      onChange={(event) => setTrainingFilters((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      <MenuItem value="">All statuses</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <Button startIcon={<AddIcon />} variant="contained" onClick={() => setTrainingDialogOpen(true)}>
                  Assign Training
                </Button>
              </Stack>
              <DataTable
                data={filteredTraining}
                columns={[
                  {
                    field: 'driver_id',
                    headerName: 'Driver',
                    renderCell: (row) => (drivers.find((d) => d.driver_id === row.driver_id)?.name || '-')
                  },
                  { field: 'course', headerName: 'Course' },
                  {
                    field: 'status',
                    headerName: 'Status',
                    renderCell: (row) => <Chip size="small" color={trainingStatusColor(row.status)} label={row.status || 'Pending'} />,
                  },
                  {
                    field: 'assigned_at',
                    headerName: 'Assigned',
                    renderCell: (row) => (row.assigned_at ? new Date(row.assigned_at).toLocaleDateString() : '-')
                  },
                  {
                    field: 'completed_at',
                    headerName: 'Completed',
                    renderCell: (row) => (row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '-')
                  },
                ]}
                pagination
                searchable={false}
              />
            </Stack>
          )}

          {activeTab === 3 && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Performance metrics aggregate recent trips to highlight on-time performance and driver ratings.
              </Typography>
              <DataTable
                data={performance}
                columns={[
                  {
                    field: 'driver_id',
                    headerName: 'Driver',
                    renderCell: (row) => row.driver_name || (drivers.find((d) => d.driver_id === row.driver_id)?.name) || '-'
                  },
                  { field: 'trips_completed', headerName: 'Trips Completed' },
                  {
                    field: 'on_time_percent',
                    headerName: 'On-time %',
                    renderCell: (row) => `${Math.round(Number(row.on_time_percent || 0))}%`,
                  },
                  { field: 'complaints', headerName: 'Complaints' },
                  {
                    field: 'rating',
                    headerName: 'Rating',
                    renderCell: (row) => Number(row.rating || 0).toFixed(1),
                  },
                ]}
                pagination
                searchable
              />
            </Stack>
          )}
        </DashboardCard>
      </Grid>

      {/* Add/Edit Shift */}
      <Dialog open={shiftDialogOpen} onClose={() => setShiftDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Shift</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="shift-driver-label">Driver</InputLabel>
              <Select
                labelId="shift-driver-label"
                label="Driver"
                value={newShift.driver_id}
                onChange={(event) => setNewShift((prev) => ({ ...prev, driver_id: event.target.value }))}
              >
                <MenuItem value="">Select driver</MenuItem>
                {(drivers || []).map((driver) => (
                  <MenuItem key={driver.driver_id} value={driver.driver_id}>{driver.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="shift-route-label">Route</InputLabel>
              <Select
                labelId="shift-route-label"
                label="Route"
                value={newShift.route_id}
                onChange={(event) => setNewShift((prev) => ({ ...prev, route_id: event.target.value }))}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {(routes || []).map((route) => (
                  <MenuItem key={route.route_id} value={route.route_id}>{`${route.origin || ''} → ${route.destination || ''}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="datetime-local"
              label="Start"
              InputLabelProps={{ shrink: true }}
              value={newShift.start_time}
              onChange={(event) => setNewShift((prev) => ({ ...prev, start_time: event.target.value }))}
              fullWidth
            />
            <TextField
              type="datetime-local"
              label="End"
              InputLabelProps={{ shrink: true }}
              value={newShift.end_time}
              onChange={(event) => setNewShift((prev) => ({ ...prev, end_time: event.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="shift-status-label">Status</InputLabel>
              <Select
                labelId="shift-status-label"
                label="Status"
                value={newShift.status}
                onChange={(event) => setNewShift((prev) => ({ ...prev, status: event.target.value }))}
              >
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShiftDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveShift} disabled={savingShift}>
            {savingShift ? 'Saving…' : 'Save Shift'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Training */}
      <Dialog open={trainingDialogOpen} onClose={() => setTrainingDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign Training</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="training-driver-select-label">Driver</InputLabel>
              <Select
                labelId="training-driver-select-label"
                label="Driver"
                value={newTraining.driver_id}
                onChange={(event) => setNewTraining((prev) => ({ ...prev, driver_id: event.target.value }))}
              >
                <MenuItem value="">Select driver</MenuItem>
                {(drivers || []).map((driver) => (
                  <MenuItem key={driver.driver_id} value={driver.driver_id}>{driver.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Course"
              value={newTraining.course}
              onChange={(event) => setNewTraining((prev) => ({ ...prev, course: event.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="training-status-select-label">Status</InputLabel>
              <Select
                labelId="training-status-select-label"
                label="Status"
                value={newTraining.status}
                onChange={(event) => setNewTraining((prev) => ({ ...prev, status: event.target.value }))}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrainingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTraining} disabled={savingTraining}>
            {savingTraining ? 'Saving…' : 'Assign Training'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Driver */}
      <Dialog open={driverDialogOpen} onClose={() => setDriverDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={driverForm.name}
              onChange={(event) => setDriverForm((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={driverForm.email}
              onChange={(event) => setDriverForm((prev) => ({ ...prev, email: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Phone"
              value={driverForm.phone}
              onChange={(event) => setDriverForm((prev) => ({ ...prev, phone: event.target.value }))}
              fullWidth
            />
            <TextField
              label="License Number"
              value={driverForm.license_number}
              onChange={(event) => setDriverForm((prev) => ({ ...prev, license_number: event.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="driver-status-select-label">Status</InputLabel>
              <Select
                labelId="driver-status-select-label"
                label="Status"
                value={driverForm.status}
                onChange={(event) => setDriverForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDriverDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDriverSubmit} disabled={driverSaving}>
            {driverSaving ? 'Saving…' : editingDriver ? 'Save Changes' : 'Create Driver'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
