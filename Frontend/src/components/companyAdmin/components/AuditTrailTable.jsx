import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  Visibility as ViewIcon
} from '@mui/icons-material';

export default function AuditTrailTable({ logs, loading, onViewDetails }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const getActionTypeColor = (type) => {
    switch (type) {
      case 'Booking': return 'primary';
      case 'Trip': return 'info';
      case 'Payment': return 'success';
      case 'Admin': return 'warning';
      case 'System': return 'default';
      default: return 'default';
    }
  };

  const getActionTypeIcon = (type) => {
    switch (type) {
      case 'Booking': return '📋';
      case 'Trip': return '🚌';
      case 'Payment': return '💳';
      case 'Admin': return '⚙️';
      case 'System': return '🖥️';
      default: return '📝';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRowStyle = (log) => {
    // Highlight error-related logs
    if (log.message.toLowerCase().includes('error') || 
        log.message.toLowerCase().includes('failed') ||
        log.message.toLowerCase().includes('cancelled')) {
      return { backgroundColor: 'rgba(255, 0, 0, 0.05)' };
    }
    return {};
  };

  const paginatedLogs = logs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading audit logs...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Message</TableCell>
            <TableCell align="center">Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedLogs.map((log) => (
            <TableRow 
              key={log.id} 
              hover
              sx={getRowStyle(log)}
            >
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {formatDateTime(log.created_at)}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '1.2em' }}>
                    {getActionTypeIcon(log.action_type)}
                  </Typography>
                  <Chip 
                    label={log.action_type} 
                    color={getActionTypeColor(log.action_type)}
                    size="small"
                  />
                </Box>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {log.user?.name || 'System'}
                </Typography>
                {log.user?.email && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {log.user.email}
                  </Typography>
                )}
              </TableCell>
              
              <TableCell>
                <Typography 
                  variant="body2"
                  sx={{ 
                    maxWidth: 400, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={log.message}
                >
                  {log.message}
                </Typography>
              </TableCell>
              
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={() => onViewDetails(log)}
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
        count={logs.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[25, 50, 100]}
      />
    </Box>
  );
}
