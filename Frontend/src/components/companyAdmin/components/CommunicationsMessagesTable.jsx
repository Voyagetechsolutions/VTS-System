import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  Delete as DeleteIcon, MarkEmailRead as MarkReadIcon,
  MarkEmailUnread as MarkUnreadIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function CommunicationsMessagesTable({ messages, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleMarkAsRead = async (message) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('id', message.id);

      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error('Error marking message as read:', error);
      alert('Error marking message as read: ' + error.message);
    }
  };

  const handleMarkAsUnread = async (message) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'unread' })
        .eq('id', message.id);

      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error('Error marking message as unread:', error);
      alert('Error marking message as unread: ' + error.message);
    }
  };

  const handleDelete = async (message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id);

      if (error) throw error;

      onUpdate();
      alert('Message deleted successfully!');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread': return 'error';
      case 'read': return 'success';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'driver': return 'primary';
      case 'staff': return 'secondary';
      case 'hr_manager': return 'info';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const truncateMessage = (message, maxLength = 60) => {
    if (!message) return 'N/A';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Sender</TableCell>
            <TableCell>Recipient</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Message Preview</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {messages
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((message) => (
              <TableRow key={message.id} sx={{ backgroundColor: message.status === 'unread' ? 'rgba(255, 193, 7, 0.1)' : 'inherit' }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={message.status === 'unread' ? 'bold' : 'normal'}>
                    {message.sender?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {message.sender?.email || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {message.recipient?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {message.recipient?.email || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={message.sender?.role || 'user'}
                    color={getRoleColor(message.sender?.role)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    fontWeight={message.status === 'unread' ? 'bold' : 'normal'}
                    sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {truncateMessage(message.message)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={message.status || 'unread'}
                    color={getStatusColor(message.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(message.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {message.status === 'unread' ? (
                      <IconButton
                        size="small"
                        onClick={() => handleMarkAsRead(message)}
                        title="Mark as Read"
                        color="success"
                      >
                        <MarkReadIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleMarkAsUnread(message)}
                        title="Mark as Unread"
                        color="warning"
                      >
                        <MarkUnreadIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(message)}
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
        count={messages.length}
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
