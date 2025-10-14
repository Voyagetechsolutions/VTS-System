import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Grid
} from '@mui/material';
import {
  Visibility as ViewIcon, Assignment as AssignIcon, CheckCircle as ResolveIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function SafetyLogsTable({ safetyLogs, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (log, newStatus) => {
    try {
      const { error } = await supabase
        .from('safety_logs')
        .update({ status: newStatus })
        .eq('id', log.id);

      if (error) throw error;

      onUpdate();
      alert(`Safety log marked as ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating safety log:', error);
      alert('Error updating safety log: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'error';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'vehicle': return 'primary';
      case 'driver': return 'secondary';
      case 'insurance': return 'info';
      case 'health': return 'warning';
      case 'passenger': return 'success';
      case 'emergency': return 'error';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const generateLogId = (log) => {
    return `SL${log.id.slice(-6).toUpperCase()}`;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Reported By</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {safetyLogs
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {generateLogId(log)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.description || 'No description provided'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.category || 'general'}
                    color={getCategoryColor(log.category)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.status || 'open'}
                    color={getStatusColor(log.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {log.reporter?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {log.reporter?.email || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(log.reported_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(log)}
                      title="View Details"
                      color="info"
                    >
                      <ViewIcon />
                    </IconButton>
                    {log.status === 'open' && (
                      <IconButton
                        size="small"
                        onClick={() => handleStatusUpdate(log, 'in_progress')}
                        title="Mark In Progress"
                        color="warning"
                      >
                        <AssignIcon />
                      </IconButton>
                    )}
                    {log.status === 'in_progress' && (
                      <IconButton
                        size="small"
                        onClick={() => handleStatusUpdate(log, 'resolved')}
                        title="Mark Resolved"
                        color="success"
                      >
                        <ResolveIcon />
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
        count={safetyLogs.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Safety Log Details Modal */}
      <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Safety Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Log ID</Typography>
                <Typography variant="body1">{generateLogId(selectedLog)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Chip
                  label={selectedLog.category || 'general'}
                  color={getCategoryColor(selectedLog.category)}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedLog.status || 'open'}
                  color={getStatusColor(selectedLog.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Reported At</Typography>
                <Typography variant="body1">{formatDateTime(selectedLog.reported_at)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{selectedLog.description || 'No description provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Reported By</Typography>
                <Typography variant="body1">
                  {selectedLog.reporter?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLog.reporter?.email || ''}
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
