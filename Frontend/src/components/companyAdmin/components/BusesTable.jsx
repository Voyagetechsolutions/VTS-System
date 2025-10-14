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
import EditBusModal from './EditBusModal';

export default function BusesTable({ buses, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);

  const handleEdit = (bus) => {
    setSelectedBus(bus);
    setShowEditModal(true);
  };

  const handleViewDetails = (bus) => {
    setSelectedBus(bus);
    setShowDetailsModal(true);
  };

  const handleDelete = async (bus) => {
    if (!window.confirm(`Are you sure you want to delete bus "${bus.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', bus.id);

      if (error) throw error;

      onUpdate();
      alert('Bus deleted successfully!');
    } catch (error) {
      console.error('Error deleting bus:', error);
      alert('Error deleting bus: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getHealthColor = (health) => {
    if (!health) return 'default';
    if (health >= 80) return 'success';
    if (health >= 60) return 'warning';
    return 'error';
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Bus Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Model</TableCell>
            <TableCell>License Plate</TableCell>
            <TableCell>Capacity</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Health</TableCell>
            <TableCell>Last Check</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {buses
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((bus) => (
              <TableRow key={bus.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {bus.name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {bus.type || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {bus.model || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {bus.license_plate || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {bus.capacity || 'N/A'} seats
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={bus.status || 'active'}
                    color={getStatusColor(bus.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {bus.health ? (
                    <Chip
                      label={`${bus.health}%`}
                      color={getHealthColor(bus.health)}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">N/A</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(bus.last_check)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(bus)}
                      title="View Details"
                      color="info"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(bus)}
                      title="Edit Bus"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(bus)}
                      title="Delete Bus"
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
        count={buses.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Bus Modal */}
      <EditBusModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        bus={selectedBus}
      />

      {/* Bus Details Modal */}
      <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bus Details</DialogTitle>
        <DialogContent>
          {selectedBus && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Bus Name</Typography>
                <Typography variant="body1">{selectedBus.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{selectedBus.type || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Model</Typography>
                <Typography variant="body1">{selectedBus.model || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">License Plate</Typography>
                <Typography variant="body1">{selectedBus.license_plate || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Capacity</Typography>
                <Typography variant="body1">{selectedBus.capacity || 'N/A'} seats</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedBus.status || 'active'}
                  color={getStatusColor(selectedBus.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Health Score</Typography>
                <Typography variant="body1">{selectedBus.health ? `${selectedBus.health}%` : 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Last Check</Typography>
                <Typography variant="body1">{formatDate(selectedBus.last_check)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Configuration</Typography>
                <Typography variant="body1">{selectedBus.config || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Insurance</Typography>
                <Typography variant="body1">{selectedBus.insurance ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Insured</Typography>
                <Typography variant="body1">{selectedBus.insured ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Permit</Typography>
                <Typography variant="body1">{selectedBus.permit || 'N/A'}</Typography>
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
