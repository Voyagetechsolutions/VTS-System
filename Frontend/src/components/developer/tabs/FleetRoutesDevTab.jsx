import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Alert } from '@mui/material';
import { Visibility as ViewIcon, Pause as PauseIcon, PlayArrow as PlayIcon, DirectionsBus as BusIcon, Route as RouteIcon, Business as BusinessIcon, Build as BuildIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getAllBusesGlobal, getAllRoutesGlobal, getCompaniesLight } from '../../../supabase/api';
import { ModernTextField, ModernButton } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function FleetRoutesDevTab() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [busPlate, setBusPlate] = useState('');
  const [busStatus, setBusStatus] = useState('');
  const [busCompany, setBusCompany] = useState('');
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [routeCompany, setRouteCompany] = useState('');
  
  // Modal states
  const [showBusProfile, setShowBusProfile] = useState(false);
  const [showRouteProfile, setShowRouteProfile] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const load = async () => {
    setLoading(true);
    const [b, r, c] = await Promise.all([getAllBusesGlobal(), getAllRoutesGlobal(), getCompaniesLight()]);
    setBuses(b.data || []);
    setRoutes(r.data || []);
    setCompanies(c.data || []);
    setLoading(false);
  };

  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);

  const filteredBuses = buses.filter(b => (
    ((busPlate || '').trim() === '' ? true : (b.license_plate || '').toLowerCase().includes(busPlate.toLowerCase())) &&
    ((busStatus || '').trim() === '' ? true : (b.status || '').toLowerCase().includes(busStatus.toLowerCase())) &&
    (busCompany ? b.company_id === busCompany : true)
  ));
  
  const filteredRoutes = routes.filter(r => (
    ((routeOrigin || '').trim() === '' ? true : (r.origin || '').toLowerCase().includes(routeOrigin.toLowerCase())) &&
    ((routeDestination || '').trim() === '' ? true : (r.destination || '').toLowerCase().includes(routeDestination.toLowerCase())) &&
    (routeCompany ? r.company_id === routeCompany : true)
  ));

  const handleViewBus = (bus) => {
    setSelectedBus(bus);
    setShowBusProfile(true);
  };

  const handleViewRoute = (route) => {
    setSelectedRoute(route);
    setShowRouteProfile(true);
  };

  const handleSuspendBus = async (busId) => {
    try {
      // TODO: Implement suspend bus functionality
      console.log('Suspending bus:', busId);
      load();
    } catch (error) {
      console.error('Error suspending bus:', error);
    }
  };

  const handleSuspendRoute = async (routeId) => {
    try {
      // TODO: Implement suspend route functionality
      console.log('Suspending route:', routeId);
      load();
    } catch (error) {
      console.error('Error suspending route:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <CheckCircleIcon />;
      case 'maintenance': return <BuildIcon />;
      case 'suspended': return <WarningIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const busActions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewBus(row),
      color: 'primary'
    },
    { 
      label: row => row.status === 'active' ? 'Suspend' : 'Activate', 
      icon: row => row.status === 'active' ? <PauseIcon /> : <PlayIcon />, 
      onClick: async ({ row }) => { 
        await handleSuspendBus(row.bus_id);
      },
      color: row => row.status === 'active' ? 'error' : 'success'
    },
  ];

  const routeActions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewRoute(row),
      color: 'primary'
    },
    { 
      label: row => row.status === 'active' ? 'Suspend' : 'Activate', 
      icon: row => row.status === 'active' ? <PauseIcon /> : <PlayIcon />, 
      onClick: async ({ row }) => { 
        await handleSuspendRoute(row.route_id);
      },
      color: row => row.status === 'active' ? 'error' : 'success'
    },
  ];

  const exportBuses = () => {
    if (!filteredBuses.length) return;
    const csv = toCSV(filteredBuses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportRoutes = () => {
    if (!filteredRoutes.length) return;
    const csv = toCSV(filteredRoutes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'routes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Buses & Routes (Company Overview)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              // Export both buses and routes
              exportBuses();
              setTimeout(() => exportRoutes(), 100);
            }}
          >
            Export Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<BusinessIcon />}
          >
            Send Notice to Companies
          </Button>
        </Box>
      </Box>

      {/* Buses Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusIcon color="primary" />
            Buses
          </Typography>
          
          {/* Bus Filters */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Bus Name/Plate"
                value={busPlate}
                onChange={(e) => setBusPlate(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={busStatus}
                  label="Status"
                  onChange={(e) => setBusStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Company</InputLabel>
                <Select
                  value={busCompany}
                  label="Company"
                  onChange={(e) => setBusCompany(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {companies.map(company => (
                    <MenuItem key={company.company_id} value={company.company_id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <DataTable
            data={filteredBuses}
            loading={loading}
            columns={[
              { 
                field: 'license_plate', 
                headerName: 'Bus Name / ID', 
                sortable: true,
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusIcon color="primary" />
                    <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'license_plate', 
                headerName: 'Plate No.',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="bold">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'company_id', 
                headerName: 'Company',
                renderCell: (params) => {
                  const company = companies.find(c => c.company_id === params.value);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" color="action" />
                      {company?.name || 'Unknown'}
                    </Box>
                  );
                }
              },
              { 
                field: 'capacity', 
                headerName: 'Capacity',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value} seats
                  </Typography>
                )
              },
              { 
                field: 'status', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    color={getStatusColor(params.value)}
                    size="small"
                    icon={getStatusIcon(params.value)}
                  />
                )
              },
              { 
                field: 'assigned_route', 
                headerName: 'Assigned Route',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value || 'Not assigned'}
                  </Typography>
                )
              },
            ]}
            rowActions={busActions}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Routes Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RouteIcon color="primary" />
            Routes
          </Typography>
          
          {/* Route Filters */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Route Name"
                value={routeOrigin}
                onChange={(e) => setRouteOrigin(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Destination"
                value={routeDestination}
                onChange={(e) => setRouteDestination(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Company</InputLabel>
                <Select
                  value={routeCompany}
                  label="Company"
                  onChange={(e) => setRouteCompany(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {companies.map(company => (
                    <MenuItem key={company.company_id} value={company.company_id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <DataTable
            data={filteredRoutes}
            loading={loading}
            columns={[
              { 
                field: 'origin', 
                headerName: 'Route Name', 
                sortable: true,
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RouteIcon color="primary" />
                    <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {params.row.origin} → {params.row.destination}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'company_id', 
                headerName: 'Company',
                renderCell: (params) => {
                  const company = companies.find(c => c.company_id === params.value);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" color="action" />
                      {company?.name || 'Unknown'}
                    </Box>
                  );
                }
              },
              { 
                field: 'origin', 
                headerName: 'Start → End',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value} → {params.row.destination}
                  </Typography>
                )
              },
              { 
                field: 'distance', 
                headerName: 'Distance',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value || 'N/A'} km
                  </Typography>
                )
              },
              { 
                field: 'assigned_buses', 
                headerName: 'Assigned Buses',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value || 0} buses
                  </Typography>
                )
              },
              { 
                field: 'status', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value || 'Active'} 
                    color={getStatusColor(params.value)}
                    size="small"
                    icon={getStatusIcon(params.value)}
                  />
                )
              },
            ]}
            rowActions={routeActions}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Bus Profile Modal */}
      <Dialog open={showBusProfile} onClose={() => setShowBusProfile(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusIcon />
            Bus Profile - {selectedBus?.license_plate}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedBus && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Bus Name/ID</Typography>
                <Typography variant="body1">{selectedBus.license_plate}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Plate Number</Typography>
                <Typography variant="body1">{selectedBus.license_plate}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Model</Typography>
                <Typography variant="body1">{selectedBus.model || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Capacity</Typography>
                <Typography variant="body1">{selectedBus.capacity} seats</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedBus.status} 
                  color={getStatusColor(selectedBus.status)}
                  size="small"
                  icon={getStatusIcon(selectedBus.status)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                <Typography variant="body1">
                  {companies.find(c => c.company_id === selectedBus.company_id)?.name || 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Current Route</Typography>
                <Typography variant="body1">{selectedBus.assigned_route || 'Not assigned'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                <Typography variant="body1">
                  {selectedBus.updated_at ? new Date(selectedBus.updated_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBusProfile(false)}>Close</Button>
          <Button 
            variant="contained" 
            color={selectedBus?.status === 'active' ? 'error' : 'success'}
            onClick={() => handleSuspendBus(selectedBus?.bus_id)}
          >
            {selectedBus?.status === 'active' ? 'Suspend Bus' : 'Activate Bus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Route Profile Modal */}
      <Dialog open={showRouteProfile} onClose={() => setShowRouteProfile(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RouteIcon />
            Route Profile - {selectedRoute?.origin} → {selectedRoute?.destination}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRoute && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Route Name</Typography>
                <Typography variant="body1">{selectedRoute.origin} → {selectedRoute.destination}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                <Typography variant="body1">
                  {companies.find(c => c.company_id === selectedRoute.company_id)?.name || 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Distance</Typography>
                <Typography variant="body1">{selectedRoute.distance || 'N/A'} km</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedRoute.status || 'Active'} 
                  color={getStatusColor(selectedRoute.status)}
                  size="small"
                  icon={getStatusIcon(selectedRoute.status)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Assigned Buses</Typography>
                <Typography variant="body1">{selectedRoute.assigned_buses || 0} buses</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRouteProfile(false)}>Close</Button>
          <Button 
            variant="contained" 
            color={selectedRoute?.status === 'active' ? 'error' : 'success'}
            onClick={() => handleSuspendRoute(selectedRoute?.route_id)}
          >
            {selectedRoute?.status === 'active' ? 'Suspend Route' : 'Activate Route'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
