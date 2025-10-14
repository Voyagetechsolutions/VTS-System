import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Card, CardContent, Chip, IconButton
} from '@mui/material';
import {
  Assignment as AssignIcon, Visibility as ViewIcon, Build as MaintenanceIcon
} from '@mui/icons-material';

export default function DepotBusesTable({ buses, loading, onAssign }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'In Transit': return 'info';
      case 'Maintenance': return 'warning';
      case 'Out of Service': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return '✅';
      case 'In Transit': return '🚌';
      case 'Maintenance': return '🔧';
      case 'Out of Service': return '❌';
      default: return '🚐';
    }
  };

  const paginatedBuses = buses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Fleet Management</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading buses data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Fleet Management</Typography>
        
        {buses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No buses data available
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Bus Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned Trip</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedBuses.map((bus) => (
                    <TableRow key={bus.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {bus.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {bus.license_plate}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {bus.type || 'Standard'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {bus.capacity} seats
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.2em' }}>
                            {getStatusIcon(bus.status)}
                          </Typography>
                          <Chip 
                            label={bus.status} 
                            color={getStatusColor(bus.status)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {bus.assigned_trip || 'Not assigned'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => onAssign('bus', bus)}
                          title="Assign to Trip"
                          color="primary"
                          disabled={bus.status === 'Maintenance' || bus.status === 'Out of Service'}
                        >
                          <AssignIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Schedule Maintenance"
                          color="warning"
                        >
                          <MaintenanceIcon />
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
                count={buses.length}
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

            {/* Fleet Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Buses: {buses.length} | 
                Active: {buses.filter(b => b.status === 'Active').length} | 
                In Transit: {buses.filter(b => b.status === 'In Transit').length} | 
                Maintenance: {buses.filter(b => b.status === 'Maintenance').length}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
