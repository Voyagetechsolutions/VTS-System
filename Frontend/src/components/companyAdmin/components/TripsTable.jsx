import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Grid
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditTripModal from './EditTripModal';

export default function TripsTable({ trips, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const handleEdit = (trip) => {
    setSelectedTrip(trip);
    setShowEditModal(true);
  };

  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    setShowDetailsModal(true);
  };

  const handleDelete = async (trip) => {
    if (!window.confirm(`Are you sure you want to delete this trip?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', trip.id);

      if (error) throw error;

      onUpdate();
      alert('Trip deleted successfully!');
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Error deleting trip: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleDateString();
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const generateTripId = (trip) => {
    return `T${trip.id.slice(-8).toUpperCase()}`;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Trip ID</TableCell>
            <TableCell>Bus</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Departure</TableCell>
            <TableCell>Arrival</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Assigned Driver</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trips
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((trip) => (
              <TableRow key={trip.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {generateTripId(trip)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {trip.bus?.name || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {trip.bus?.license_plate || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {trip.route?.pick_up || 'N/A'} → {trip.route?.drop_off || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(trip.departure)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(trip.departure)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(trip.arrival)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(trip.arrival)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={trip.status || 'scheduled'}
                    color={getStatusColor(trip.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {trip.driver?.name || 'Unassigned'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(trip)}
                      title="View Details"
                      color="info"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(trip)}
                      title="Edit Trip"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(trip)}
                      title="Delete Trip"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={trips.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Trip Modal */}
      <EditTripModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        trip={selectedTrip}
      />

      {/* Trip Details Modal */}
      <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Trip Details</DialogTitle>
        <DialogContent>
          {selectedTrip && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Trip ID</Typography>
                <Typography variant="body1">{generateTripId(selectedTrip)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedTrip.status || 'scheduled'}
                  color={getStatusColor(selectedTrip.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Bus</Typography>
                <Typography variant="body1">
                  {selectedTrip.bus?.name || 'N/A'} ({selectedTrip.bus?.license_plate || 'N/A'})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Route</Typography>
                <Typography variant="body1">
                  {selectedTrip.route?.pick_up || 'N/A'} → {selectedTrip.route?.drop_off || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Departure</Typography>
                <Typography variant="body1">{formatDateTime(selectedTrip.departure)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Arrival</Typography>
                <Typography variant="body1">{formatDateTime(selectedTrip.arrival)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Assigned Driver</Typography>
                <Typography variant="body1">{selectedTrip.driver?.name || 'Unassigned'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                <Typography variant="body1">{formatDateTime(selectedTrip.created_at)}</Typography>
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
