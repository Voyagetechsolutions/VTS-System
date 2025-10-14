import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Card, CardContent, Chip, IconButton
} from '@mui/material';
import {
  Edit as EditIcon, Visibility as ViewIcon, Add as AddIcon
} from '@mui/icons-material';

export default function ShiftsTable({ shifts, loading }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Scheduled': return 'info';
      case 'Completed': return 'default';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return '🟢';
      case 'Scheduled': return '📅';
      case 'Completed': return '✅';
      case 'Cancelled': return '❌';
      default: return '⏰';
    }
  };

  const paginatedShifts = shifts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Shift Management</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading shifts data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Shift Management</Typography>
          <IconButton
            size="small"
            color="primary"
            title="Add New Shift"
          >
            <AddIcon />
          </IconButton>
        </Box>
        
        {shifts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No scheduled shifts found
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedShifts.map((shift) => (
                    <TableRow key={shift.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {shift.staff?.name || 'Unknown Employee'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {shift.staff?.role || 'Unknown Role'}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {shift.start_time}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {shift.end_time}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.2em' }}>
                            {getStatusIcon(shift.status)}
                          </Typography>
                          <Chip 
                            label={shift.status} 
                            color={getStatusColor(shift.status)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          title="Edit Shift"
                          color="primary"
                          disabled={shift.status === 'Completed'}
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
                count={shifts.length}
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

            {/* Shifts Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Shifts: {shifts.length} | 
                Active: {shifts.filter(s => s.status === 'Active').length} | 
                Scheduled: {shifts.filter(s => s.status === 'Scheduled').length} | 
                Completed: {shifts.filter(s => s.status === 'Completed').length}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
