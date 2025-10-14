import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Send as SendIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function AnnouncementsTable({ announcements, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSend = async (announcement) => {
    if (!window.confirm('Are you sure you want to send this announcement?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .update({ status: 'sent' })
        .eq('id', announcement.id);

      if (error) throw error;

      onUpdate();
      alert('Announcement sent successfully!');
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Error sending announcement: ' + error.message);
    }
  };

  const handleDelete = async (announcement) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (error) throw error;

      onUpdate();
      alert('Announcement deleted successfully!');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error deleting announcement: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'warning';
      case 'sent': return 'success';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const formatTargetRoles = (roles) => {
    if (!roles || !Array.isArray(roles)) return 'N/A';
    if (roles.includes('all')) return 'All Users';
    return roles.join(', ');
  };

  const truncateMessage = (message, maxLength = 80) => {
    if (!message) return 'N/A';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Target Audience</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {announcements
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((announcement) => (
              <TableRow key={announcement.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {announcement.title || 'Untitled'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {truncateMessage(announcement.message)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatTargetRoles(announcement.target_roles)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={announcement.status || 'draft'}
                    color={getStatusColor(announcement.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(announcement.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      title="Edit"
                      disabled={announcement.status === 'sent'}
                    >
                      <EditIcon />
                    </IconButton>
                    {announcement.status === 'draft' && (
                      <IconButton
                        size="small"
                        onClick={() => handleSend(announcement)}
                        title="Send Announcement"
                        color="success"
                      >
                        <SendIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(announcement)}
                      title="Delete"
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
        count={announcements.length}
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
