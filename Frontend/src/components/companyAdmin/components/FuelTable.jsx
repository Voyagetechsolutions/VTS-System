import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Receipt as ReceiptIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditFuelModal from './EditFuelModal';

export default function FuelTable({ logs, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = (log) => {
    setSelectedLog(log);
    setShowEditModal(true);
  };

  const handleDelete = (log) => {
    setSelectedLog(log);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedLog) return;

    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('fuel_logs')
        .delete()
        .eq('id', selectedLog.id);

      if (error) throw error;

      setShowDeleteDialog(false);
      setSelectedLog(null);
      onUpdate();
    } catch (error) {
      console.error('Error deleting fuel log:', error);
      alert('Error deleting fuel log: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedLog(null);
    onUpdate();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLiters = (liters) => {
    return `${parseFloat(liters).toFixed(1)}L`;
  };

  const paginatedLogs = logs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bus</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Liters</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Station</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {log.bus_name || 'Unknown Bus'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(log.date)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {formatLiters(log.liters)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(log.cost)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {log.station || 'Unknown Station'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {log.receipt_file_url && (
                    <IconButton
                      size="small"
                      onClick={() => window.open(log.receipt_file_url, '_blank')}
                      title="View Receipt"
                      color="info"
                    >
                      <ReceiptIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(log)}
                    title="Edit Log"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(log)}
                    title="Delete Log"
                    color="error"
                  >
                    <DeleteIcon />
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
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>

      {/* Edit Fuel Modal */}
      {selectedLog && (
        <EditFuelModal
          open={showEditModal}
          log={selectedLog}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Fuel Log</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this fuel log for "{selectedLog?.bus_name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
