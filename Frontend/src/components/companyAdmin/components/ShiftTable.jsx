import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function ShiftTable({ shifts, onUpdate, onMetricsUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [editForm, setEditForm] = useState({
    department: '',
    role: '',
    start_time: '',
    end_time: '',
    status: ''
  });

  // const companyId = window.companyId || localStorage.getItem('companyId'); // TODO: Use for API calls

  const handleEdit = (shift) => {
    setSelectedShift(shift);
    setEditForm({
      department: shift.department || '',
      role: shift.role || '',
      start_time: shift.start_time ? new Date(shift.start_time).toISOString().slice(0, 16) : '',
      end_time: shift.end_time ? new Date(shift.end_time).toISOString().slice(0, 16) : '',
      status: shift.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!selectedShift) return;

      const { error } = await supabase
        .from('shifts')
        .update({
          department: editForm.department,
          role: editForm.role,
          start_time: new Date(editForm.start_time).toISOString(),
          end_time: new Date(editForm.end_time).toISOString(),
          status: editForm.status
        })
        .eq('id', selectedShift.id);

      if (error) throw error;

      setShowEditModal(false);
      setSelectedShift(null);
      onUpdate();
      onMetricsUpdate();
      alert('Shift updated successfully!');
    } catch (error) {
      console.error('Error updating shift:', error);
      alert('Error updating shift: ' + error.message);
    }
  };

  const handleDelete = async (shift) => {
    if (!window.confirm(`Are you sure you want to delete the shift for ${shift.employee?.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shift.id);

      if (error) throw error;

      onUpdate();
      onMetricsUpdate();
      alert('Shift deleted successfully!');
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('Error deleting shift: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  // const formatTime = (dateTime) => { // TODO: Implement if needed
  //   if (!dateTime) return 'N/A';
  //   return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shifts
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((shift) => (
              <TableRow key={shift.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {shift.employee?.name || 'Unknown Employee'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {shift.department || shift.employee?.department || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {shift.role || shift.employee?.role || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(shift.start_time)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(shift.end_time)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={shift.status || 'active'}
                    color={getStatusColor(shift.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(shift)}
                      title="Edit Shift"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(shift)}
                      title="Delete Shift"
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
        count={shifts.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Shift Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={editForm.start_time}
                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                value={editForm.end_time}
                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
