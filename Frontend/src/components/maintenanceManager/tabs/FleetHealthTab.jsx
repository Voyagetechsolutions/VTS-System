import React, { useEffect, useState } from 'react';
import { Grid, Box, Card, CardContent, Typography, Chip, LinearProgress, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { DirectionsBus as BusIcon, Build as BuildIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, Schedule as ScheduleIcon, LocalGasStation as FuelIcon, Speed as SpeedIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function FleetHealthTab() {
  const [fleet, setFleet] = useState([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showScheduleMaintenance, setShowScheduleMaintenance] = useState(false);
  const [showViewHistory, setShowViewHistory] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  
  // Form states
  const [maintenanceForm, setMaintenanceForm] = useState({
    bus_id: '',
    maintenanceType: '',
    scheduledDate: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: busesData }, { data: alertsData }] = await Promise.all([
        supabase
          .from('buses')
          .select(`
            bus_id, license_plate, status, mileage, last_service_at, next_inspection_date,
            maintenance_logs!inner(created_at, notes, status)
          `)
          .eq('company_id', companyId)
          .order('license_plate'),
        supabase
          .from('predictive_alerts')
          .select(`
            id, bus_id, alert_type, predicted_issue, severity, predicted_date, status, created_at,
            buses!inner(license_plate)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
      ]);
      
      // Transform fleet data to include maintenance history
      const transformedFleet = (busesData || []).map(bus => ({
        ...bus,
        lastMaintenance: bus.maintenance_logs?.[0]?.created_at || bus.last_service_at,
        maintenanceStatus: bus.maintenance_logs?.[0]?.status || 'Unknown'
      }));
      
      // Transform predictive alerts to include bus plate numbers
      const transformedAlerts = (alertsData || []).map(alert => ({
        ...alert,
        busPlate: alert.buses?.license_plate || alert.bus_id
      }));
      
      setFleet(transformedFleet);
      setPredictiveAlerts(transformedAlerts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleScheduleMaintenance = async () => {
    try {
      if (!maintenanceForm.bus_id || !maintenanceForm.maintenanceType) return;
      await supabase.from('maintenance_logs').insert([{
        company_id: companyId,
        bus_id: maintenanceForm.bus_id,
        maintenance_type: maintenanceForm.maintenanceType,
        scheduled_date: maintenanceForm.scheduledDate,
        notes: maintenanceForm.notes,
        status: 'scheduled'
      }]);
      setShowScheduleMaintenance(false);
      setMaintenanceForm({
        bus_id: '',
        maintenanceType: '',
        scheduledDate: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await supabase.from('predictive_alerts').update({
        status: 'acknowledged'
      }).eq('id', alertId);
      loadData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleSchedulePreemptiveMaintenance = async (alert) => {
    try {
      setMaintenanceForm({
        bus_id: alert.bus_id,
        maintenanceType: 'preventive',
        scheduledDate: '',
        notes: `Pre-emptive maintenance for: ${alert.predicted_issue}`
      });
      setShowScheduleMaintenance(true);
    } catch (error) {
      console.error('Error scheduling pre-emptive maintenance:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'inspection': return 'info';
      case 'repair': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Fleet Health & Fleet Predictive
        </Typography>
      </Box>

      {/* Fleet Overview Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Fleet Overview Table</Typography>
          <DataTable
            data={fleet}
            loading={loading}
            columns={[
              { 
                field: 'license_plate', 
                headerName: 'Bus',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
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
                    color={getStatusColor(params.value)}
                  />
                )
              },
              { 
                field: 'lastMaintenance', 
                headerName: 'Last Maintenance',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
                  </Typography>
                )
              },
              { 
                field: 'mileage', 
                headerName: 'Mileage',
                renderCell: (params) => (
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    {params.value ? `${params.value.toLocaleString()} km` : 'N/A'}
                  </Typography>
                )
              },
              { 
                field: 'next_inspection_date', 
                headerName: 'Next Inspection',
                renderCell: (params) => {
                  const isOverdue = params.value && new Date(params.value) < new Date();
                  return (
                    <Typography 
                      variant="body2" 
                      color={isOverdue ? 'error' : 'text.secondary'}
                      fontWeight={isOverdue ? 'bold' : 'normal'}
                    >
                      {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
                    </Typography>
                  );
                }
              }
            ]}
            rowActions={[
              { label: 'View History', icon: <HistoryIcon />, onClick: ({ row }) => {
                setSelectedBus(row);
                setShowViewHistory(true);
              }},
              { label: 'Schedule Maintenance', icon: <ScheduleIcon />, onClick: ({ row }) => {
                setMaintenanceForm({...maintenanceForm, bus_id: row.bus_id});
                setShowScheduleMaintenance(true);
              }}
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Predictive Alerts Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Predictive Alerts Table</Typography>
          <DataTable
            data={predictiveAlerts}
            loading={loading}
            columns={[
              { 
                field: 'busPlate', 
                headerName: 'Bus',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'alert_type', 
                headerName: 'Alert Type',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color="info"
                  />
                )
              },
              { 
                field: 'predicted_issue', 
                headerName: 'Predicted Issue',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="medium">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'severity', 
                headerName: 'Severity',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color={getSeverityColor(params.value)}
                  />
                )
              },
              { 
                field: 'predicted_date', 
                headerName: 'Predicted Date',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
                  </Typography>
                )
              },
              { 
                field: 'status', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value || 'Active'} 
                    size="small" 
                    color={params.value === 'acknowledged' ? 'success' : 'warning'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Acknowledge', icon: <CheckCircleIcon />, onClick: ({ row }) => handleAcknowledgeAlert(row.id) },
              { label: 'Schedule Pre-emptive Maintenance', icon: <BuildIcon />, onClick: ({ row }) => handleSchedulePreemptiveMaintenance(row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Schedule Maintenance Modal */}
      <Dialog open={showScheduleMaintenance} onClose={() => setShowScheduleMaintenance(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Bus/Vehicle</InputLabel>
                <Select
                  value={maintenanceForm.bus_id}
                  label="Bus/Vehicle"
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, bus_id: e.target.value})}
                >
                  <MenuItem value="">Select Bus...</MenuItem>
                  {fleet.map(bus => (
                    <MenuItem key={bus.bus_id} value={bus.bus_id}>
                      {bus.license_plate}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Maintenance Type</InputLabel>
                <Select
                  value={maintenanceForm.maintenanceType}
                  label="Maintenance Type"
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, maintenanceType: e.target.value})}
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="preventive">Preventive</MenuItem>
                  <MenuItem value="inspection">Inspection</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scheduled Date"
                type="date"
                value={maintenanceForm.scheduledDate}
                onChange={(e) => setMaintenanceForm({...maintenanceForm, scheduledDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={maintenanceForm.notes}
                onChange={(e) => setMaintenanceForm({...maintenanceForm, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScheduleMaintenance(false)}>Cancel</Button>
          <Button onClick={handleScheduleMaintenance} variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* View History Modal */}
      <Dialog open={showViewHistory} onClose={() => setShowViewHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>Maintenance History - {selectedBus?.license_plate}</DialogTitle>
        <DialogContent>
          {selectedBus && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Current Status</Typography>
                  <Chip 
                    label={selectedBus.status} 
                    color={getStatusColor(selectedBus.status)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Mileage</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedBus.mileage ? `${selectedBus.mileage.toLocaleString()} km` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Last Maintenance</Typography>
                  <Typography variant="body1">
                    {selectedBus.lastMaintenance ? new Date(selectedBus.lastMaintenance).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Next Inspection</Typography>
                  <Typography variant="body1">
                    {selectedBus.next_inspection_date ? new Date(selectedBus.next_inspection_date).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Recent Maintenance Logs</Typography>
              <Typography variant="body2" color="text.secondary">
                Maintenance history details would be displayed here...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
