import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Card, CardContent, Chip, IconButton
} from '@mui/material';
import {
  Assignment as AssignIcon, Visibility as ViewIcon, Edit as EditIcon
} from '@mui/icons-material';

export default function DepotTripsTable({ trips, loading }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Scheduled': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return '✅';
      case 'In Progress': return '🚌';
      case 'Scheduled': return '⏰';
      case 'Cancelled': return '❌';
      default: return '📋';
    }
  };

  const paginatedTrips = trips.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>All Trips</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading trips data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>All Trips</Typography>
        
        {trips.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No trips data available
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Trip ID</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Departure</TableCell>
                    <TableCell>Arrival</TableCell>
                    <TableCell>Assigned Bus</TableCell>
                    <TableCell>Assigned Driver</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTrips.map((trip) => (
                    <TableRow key={trip.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {trip.id.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {trip.route ? 
                            `${trip.route.pick_up} → ${trip.route.drop_off}` : 
                            'Route not assigned'
                          }
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(trip.departure)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(trip.arrival)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {trip.bus?.name || 'Not assigned'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {trip.driver?.name || 'Not assigned'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.2em' }}>
                            {getStatusIcon(trip.status)}
                          </Typography>
                          <Chip 
                            label={trip.status} 
                            color={getStatusColor(trip.status)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          title="Assign Resources"
                          color="primary"
                          disabled={trip.status === 'Completed' || trip.status === 'Cancelled'}
                        >
                          <AssignIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Edit Trip"
                          color="warning"
                          disabled={trip.status === 'Completed' || trip.status === 'In Progress'}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="View Details"
                          color="info"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={trips.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </Box>

            {/* Trips Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Trips: {trips.length} | 
                Completed: {trips.filter(t => t.status === 'Completed').length} | 
                In Progress: {trips.filter(t => t.status === 'In Progress').length} | 
                Scheduled: {trips.filter(t => t.status === 'Scheduled').length}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
