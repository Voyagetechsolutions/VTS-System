import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Report as ReportIcon,
  DirectionsBus as BusIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import DataTable from '../../common/DataTable';

export default function ReportIncidentTab() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [showEditIncident, setShowEditIncident] = useState(false);
  const [showViewIncident, setShowViewIncident] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Get company ID from user context
  const companyId = 'your-company-id'; // Replace with actual company ID

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          buses:bus_id (plate_number, name),
          users:reported_by (name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setSnackbar({ open: true, message: 'Error fetching incidents', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (formData) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .insert([{
          ...formData,
          company_id: companyId,
          status: 'reported',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      setSnackbar({ open: true, message: 'Incident reported successfully', severity: 'success' });
      fetchIncidents();
    } catch (error) {
      console.error('Error creating incident:', error);
      setSnackbar({ open: true, message: 'Error reporting incident', severity: 'error' });
    }
  };

  const handleUpdateIncident = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setSnackbar({ open: true, message: 'Incident updated successfully', severity: 'success' });
      fetchIncidents();
    } catch (error) {
      console.error('Error updating incident:', error);
      setSnackbar({ open: true, message: 'Error updating incident', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'warning';
      case 'investigating': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Report Incident
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowNewIncident(true)}
        >
          New Incident
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search by Bus/Vehicle"
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select label="Type">
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="mechanical">Mechanical</MenuItem>
                  <MenuItem value="electrical">Electrical</MenuItem>
                  <MenuItem value="safety">Safety</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select label="Severity">
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select label="Status">
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="reported">Reported</MenuItem>
                  <MenuItem value="investigating">Investigating</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Incidents Table</Typography>
          <DataTable
            data={incidents}
            loading={loading}
            columns={[
              { 
                field: 'id', 
                headerName: 'Incident ID',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="medium" color="primary">
                    #{params.value}
                  </Typography>
                )
              },
              { 
                field: 'busPlate', 
                headerName: 'Bus / Vehicle',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {params.row.buses?.plate_number || 'N/A'}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'type', 
                headerName: 'Type',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color="info"
                  />
                )
              },
              { 
                field: 'details', 
                headerName: 'Details',
                renderCell: (params) => (
                  <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                field: 'reported_by', 
                headerName: 'Reported By',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {params.row.users?.name || 'N/A'}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'created_at', 
                headerName: 'Date',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                  </Typography>
                )
              }
            ]}
            rowActions={[
              { label: 'View', icon: <ViewIcon />, onClick: ({ row }) => { setSelectedIncident(row); setShowViewIncident(true); } },
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => { setSelectedIncident(row); setShowEditIncident(true); } },
              { label: 'Update Status', icon: <CheckCircleIcon />, onClick: ({ row }) => console.log('Update Status', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <NewIncidentModal
        open={showNewIncident}
        onClose={() => setShowNewIncident(false)}
        onSave={handleCreateIncident}
      />
      
      <EditIncidentModal
        open={showEditIncident}
        onClose={() => setShowEditIncident(false)}
        onSave={(updates) => handleUpdateIncident(selectedIncident?.id, updates)}
        incident={selectedIncident}
      />
      
      <ViewIncidentModal
        open={showViewIncident}
        onClose={() => setShowViewIncident(false)}
        incident={selectedIncident}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// New Incident Modal
function NewIncidentModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    bus_id: '',
    type: '',
    details: '',
    severity: 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Report New Incident</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Bus / Vehicle</InputLabel>
                <Select
                  value={formData.bus_id}
                  onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                  label="Bus / Vehicle"
                >
                  <MenuItem value="bus-1">Bus 1 - ABC-123</MenuItem>
                  <MenuItem value="bus-2">Bus 2 - DEF-456</MenuItem>
                  <MenuItem value="bus-3">Bus 3 - GHI-789</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="mechanical">Mechanical</MenuItem>
                  <MenuItem value="electrical">Electrical</MenuItem>
                  <MenuItem value="safety">Safety</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  label="Severity"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Details"
                multiline
                rows={4}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Describe the incident in detail..."
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Report Incident</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Edit Incident Modal
function EditIncidentModal({ open, onClose, onSave, incident }) {
  const [formData, setFormData] = useState({
    status: '',
    resolution: '',
    assigned_to: ''
  });

  useEffect(() => {
    if (incident) {
      setTimeout(() => {
        setFormData({
          status: incident.status || '',
          resolution: incident.resolution || '',
          assigned_to: incident.assigned_to || ''
        });
      }, 0);
    }
  }, [incident]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Incident</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="reported">Reported</MenuItem>
                  <MenuItem value="investigating">Investigating</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  label="Assigned To"
                >
                  <MenuItem value="staff-1">John Doe</MenuItem>
                  <MenuItem value="staff-2">Jane Smith</MenuItem>
                  <MenuItem value="staff-3">Mike Johnson</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Resolution"
                multiline
                rows={4}
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                placeholder="Describe the resolution or action taken..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Update Incident</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// View Incident Modal
function ViewIncidentModal({ open, onClose, incident }) {
  if (!incident) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Incident Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Incident ID</Typography>
            <Typography variant="body1" fontWeight="medium">#{incident.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Bus/Vehicle</Typography>
            <Typography variant="body1">{incident.buses?.plate_number || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Type</Typography>
            <Typography variant="body1">{incident.type}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Severity</Typography>
            <Typography variant="body1">{incident.severity}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Typography variant="body1">{incident.status}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Reported By</Typography>
            <Typography variant="body1">{incident.users?.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Details</Typography>
            <Typography variant="body1">{incident.details}</Typography>
          </Grid>
          {incident.resolution && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Resolution</Typography>
              <Typography variant="body1">{incident.resolution}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
