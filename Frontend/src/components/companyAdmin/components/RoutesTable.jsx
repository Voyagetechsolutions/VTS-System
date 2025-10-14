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
import EditRouteModal from './EditRouteModal';

export default function RoutesTable({ routes, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const handleEdit = (route) => {
    setSelectedRoute(route);
    setShowEditModal(true);
  };

  const handleViewDetails = (route) => {
    setSelectedRoute(route);
    setShowDetailsModal(true);
  };

  const handleDelete = async (route) => {
    if (!window.confirm(`Are you sure you want to delete the route from "${route.pick_up}" to "${route.drop_off}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', route.id);

      if (error) throw error;

      onUpdate();
      alert('Route deleted successfully!');
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Error deleting route: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatTimes = (times) => {
    if (!times || !Array.isArray(times)) return 'N/A';
    return times.join(', ');
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Pick Up</TableCell>
            <TableCell>Drop Off</TableCell>
            <TableCell>Departure Times</TableCell>
            <TableCell>Arrival Times</TableCell>
            <TableCell>Frequency</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {routes
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((route) => (
              <TableRow key={route.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {route.pick_up || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {route.drop_off || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatTimes(route.departure_times)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatTimes(route.arrival_times)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {route.frequency || 'N/A'} trips
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium" color="primary">
                    {formatCurrency(route.price)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={route.status || 'active'}
                    color={getStatusColor(route.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(route)}
                      title="View Details"
                      color="info"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(route)}
                      title="Edit Route"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(route)}
                      title="Delete Route"
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
        count={routes.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Route Modal */}
      <EditRouteModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        route={selectedRoute}
      />

      {/* Route Details Modal */}
      <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Route Details</DialogTitle>
        <DialogContent>
          {selectedRoute && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Route Name</Typography>
                <Typography variant="body1">{selectedRoute.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedRoute.status || 'active'}
                  color={getStatusColor(selectedRoute.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Pick Up Location</Typography>
                <Typography variant="body1">{selectedRoute.pick_up || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Drop Off Location</Typography>
                <Typography variant="body1">{selectedRoute.drop_off || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Departure Times</Typography>
                <Typography variant="body1">{formatTimes(selectedRoute.departure_times)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Arrival Times</Typography>
                <Typography variant="body1">{formatTimes(selectedRoute.arrival_times)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Frequency</Typography>
                <Typography variant="body1">{selectedRoute.frequency || 'N/A'} trips per day</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                <Typography variant="body1" color="primary" fontWeight="medium">
                  {formatCurrency(selectedRoute.price)}
                </Typography>
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
