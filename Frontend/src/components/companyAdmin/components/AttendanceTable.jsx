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

export default function AttendanceTable({ data = [], onUpdate, onMetricsUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    date: '',
    status: '',
    check_in: '',
    check_out: ''
  });

  // const companyId = window.companyId || localStorage.getItem('companyId'); // TODO: Use for API calls

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setEditForm({
      date: record.date || '',
      status: record.status || 'present',
      check_in: record.check_in ? record.check_in.slice(0, 5) : '',
      check_out: record.check_out ? record.check_out.slice(0, 5) : ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!selectedRecord) return;

      const { error } = await supabase
        .from('attendance')
        .update({
          date: editForm.date,
          status: editForm.status,
          check_in: editForm.check_in || null,
          check_out: editForm.check_out || null
        })
        .eq('id', selectedRecord.id);

      if (error) throw error;

      setShowEditModal(false);
      setSelectedRecord(null);
      onUpdate();
      onMetricsUpdate();
      alert('Attendance record updated successfully!');
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Error updating attendance: ' + error.message);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure you want to delete the attendance record for ${record.employee?.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      onUpdate();
      onMetricsUpdate();
      alert('Attendance record deleted successfully!');
    } catch (error) {
      console.error('Error deleting attendance:', error);
      alert('Error deleting attendance: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'half_day': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'N/A';
    
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    const diffMinutes = outMinutes - inMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Check-in</TableCell>
            <TableCell>Check-out</TableCell>
            <TableCell>Working Hours</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {record.employee?.name || 'Unknown Employee'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {record.employee?.department || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(record.date)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatTime(record.check_in)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatTime(record.check_out)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {calculateWorkingHours(record.check_in, record.check_out)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={record.status || 'present'}
                    color={getStatusColor(record.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(record)}
                      title="Edit Attendance"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(record)}
                      title="Delete Attendance"
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
        count={data.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Attendance Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="half_day">Half Day</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Check-in Time"
                type="time"
                value={editForm.check_in}
                onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Check-out Time"
                type="time"
                value={editForm.check_out}
                onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
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
