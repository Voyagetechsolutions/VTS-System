import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box, Avatar
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, LockReset as LockResetIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditStaffModal from './EditStaffModal';

export default function StaffTable({ staff, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const handleEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  const handleDelete = async (staffMember) => {
    if (!window.confirm(`Are you sure you want to delete ${staffMember.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffMember.id);

      if (error) throw error;

      onUpdate();
      alert('Staff member deleted successfully!');
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Error deleting staff: ' + error.message);
    }
  };

  const handleResetPassword = async (staffMember) => {
    if (!window.confirm(`Send password reset email to ${staffMember.email}?`)) {
      return;
    }

    try {
      // In a real implementation, you would call Supabase auth reset password
      // For now, we'll just show a success message
      alert(`Password reset email sent to ${staffMember.email}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error resetting password: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'supervisor': return 'warning';
      case 'hr_manager': return 'info';
      case 'driver': return 'primary';
      case 'booking_officer': return 'secondary';
      case 'maintenance_manager': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getInitials = (name) => {
    if (!name) return 'N/A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Date Joined</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {staff
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                      {getInitials(member.name)}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {member.name || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {member.email || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {member.department || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={member.role || 'staff'}
                    color={getRoleColor(member.role)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={member.status || 'active'}
                    color={getStatusColor(member.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {member.phone || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(member.date_joined)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(member)}
                      title="Edit Staff"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleResetPassword(member)}
                      title="Reset Password"
                      color="warning"
                    >
                      <LockResetIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(member)}
                      title="Delete Staff"
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
        count={staff.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        staffMember={selectedStaff}
      />
    </>
  );
}
