import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Grid
} from '@mui/material';
import {
  Edit as EditIcon, Visibility as ViewIcon, Assignment as AssignIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function OpenIncidentsTable({ incidents = [], onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const handleViewDetails = (incident) => {
    setSelectedIncident(incident);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (incident, newStatus) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', incident.id);

      if (error) throw error;

      onUpdate();
      alert(`Incident marked as ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating incident:', error);
      alert('Error updating incident: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'error';
      case 'in_progress': return 'warning';
      case 'closed': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'breakdown': return 'error';
      case 'delay': return 'warning';
      case 'staff_issue': return 'info';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const generateIncidentId = (incident) => {
    if (!incident || !incident.id) {
      return 'INC000000';
    }
    const id = String(incident.id);
    return `INC${id.slice(-6).toUpperCase()}`;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Incident ID</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Reported By</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {incidents
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((incident, index) => (
              <TableRow key={incident?.id || `incident-${index}`}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {generateIncidentId(incident)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={incident.type || 'general'}
                    color={getTypeColor(incident.type)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {incident.description || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {incident.reporter?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {incident.reporter?.email || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={incident.priority || 'medium'}
                    color={getPriorityColor(incident.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={incident.status || 'open'}
                    color={getStatusColor(incident.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(incident)}
                      title="View Details"
                      color="info"
                    >
                      <ViewIcon />
                    </IconButton>
                    {incident.status === 'open' && (
                      <IconButton
                        size="small"
                        onClick={() => handleStatusUpdate(incident, 'in_progress')}
                        title="Mark In Progress"
                        color="warning"
                      >
                        <AssignIcon />
                      </IconButton>
                    )}
                    {incident.status === 'in_progress' && (
                      <IconButton
                        size="small"
                        onClick={() => handleStatusUpdate(incident, 'closed')}
                        title="Close Incident"
                        color="success"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={incidents.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Incident Details Modal */}
      <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Incident Details</DialogTitle>
        <DialogContent>
          {selectedIncident && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Incident ID</Typography>
                <Typography variant="body1">{generateIncidentId(selectedIncident)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Chip
                  label={selectedIncident.type || 'general'}
                  color={getTypeColor(selectedIncident.type)}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                <Chip
                  label={selectedIncident.priority || 'medium'}
                  color={getPriorityColor(selectedIncident.priority)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedIncident.status || 'open'}
                  color={getStatusColor(selectedIncident.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{selectedIncident.description || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Reported By</Typography>
                <Typography variant="body1">
                  {selectedIncident.reporter?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedIncident.reporter?.email || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Reported At</Typography>
                <Typography variant="body1">{formatDateTime(selectedIncident.created_at)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
