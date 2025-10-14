import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  CheckCircle as AcknowledgeIcon, Done as ResolveIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function ActivityAlertsTable({ alerts, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleAcknowledge = async (alert) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'acknowledged' })
        .eq('id', alert.id);

      if (error) throw error;

      onUpdate();
      alert('Alert acknowledged successfully!');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      alert('Error acknowledging alert: ' + error.message);
    }
  };

  const handleResolve = async (alert) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'resolved' })
        .eq('id', alert.id);

      if (error) throw error;

      onUpdate();
      alert('Alert resolved successfully!');
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('Error resolving alert: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'error';
      case 'acknowledged': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'booking': return 'primary';
      case 'payment': return 'secondary';
      case 'trip': return 'info';
      case 'system': return 'warning';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alerts
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(alert.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={alert.type || 'system'}
                    color={getTypeColor(alert.type)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alert.message || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={alert.status || 'open'}
                    color={getStatusColor(alert.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleAcknowledge(alert)}
                      title="Acknowledge"
                      disabled={alert.status === 'acknowledged' || alert.status === 'resolved'}
                      color="warning"
                    >
                      <AcknowledgeIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleResolve(alert)}
                      title="Resolve"
                      disabled={alert.status === 'resolved'}
                      color="success"
                    >
                      <ResolveIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={alerts.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
}
