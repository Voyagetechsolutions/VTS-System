import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Card, CardContent, Chip, IconButton, Avatar
} from '@mui/material';
import {
  Assignment as AssignIcon, Visibility as ViewIcon, Phone as PhoneIcon
} from '@mui/icons-material';

export default function DriversTable({ drivers, loading, onAssign }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'On Trip': return 'info';
      case 'On Break': return 'warning';
      case 'Off Duty': return 'default';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return '✅';
      case 'On Trip': return '🚗';
      case 'On Break': return '☕';
      case 'Off Duty': return '🏠';
      case 'Inactive': return '❌';
      default: return '👤';
    }
  };

  const paginatedDrivers = drivers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Driver Management</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading drivers data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Driver Management</Typography>
        
        {drivers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No drivers data available
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>License</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned Trip</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDrivers.map((driver) => (
                    <TableRow key={driver.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {driver.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {driver.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {driver.id.slice(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {driver.license_number || 'Not provided'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.2em' }}>
                            {getStatusIcon(driver.status)}
                          </Typography>
                          <Chip 
                            label={driver.status} 
                            color={getStatusColor(driver.status)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {driver.assigned_trip || 'Not assigned'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => onAssign('driver', driver)}
                          title="Assign to Trip"
                          color="primary"
                          disabled={driver.status === 'On Trip' || driver.status === 'Inactive'}
                        >
                          <AssignIcon />
                        </IconButton>
                        {driver.phone && (
                          <IconButton
                            size="small"
                            title="Call Driver"
                            color="success"
                            onClick={() => window.open(`tel:${driver.phone}`)}
                          >
                            <PhoneIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          title="View Profile"
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
                count={drivers.length}
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

            {/* Drivers Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Drivers: {drivers.length} | 
                Active: {drivers.filter(d => d.status === 'Active').length} | 
                On Trip: {drivers.filter(d => d.status === 'On Trip').length} | 
                Available: {drivers.filter(d => d.status === 'Active' || d.status === 'On Break').length}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
