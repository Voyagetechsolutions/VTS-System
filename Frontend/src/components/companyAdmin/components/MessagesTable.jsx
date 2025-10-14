import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Grid
} from '@mui/material';
import {
  MarkEmailRead as MarkReadIcon, MarkEmailUnread as MarkUnreadIcon, 
  Visibility as ViewIcon, Archive as ArchiveIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function MessagesTable({ messages, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
    
    // Mark as read when viewing
    if (message.status === 'unread') {
      handleMarkAsRead(message);
    }
  };

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
      alert('Message marked as unread!');
    } catch (error) {
      console.error('Error marking message as unread:', error);
      alert('Error marking message as unread: ' + error.message);
    }
  };

  const handleArchive = async (message) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'archived' })
        .eq('id', message.id);

      if (error) throw error;

      onUpdate();
      alert('Message archived successfully!');
    } catch (error) {
      console.error('Error archiving message:', error);
      alert('Error archiving message: ' + error.message);
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

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'N/A';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Sender</TableCell>
            <TableCell>Recipient</TableCell>
            <TableCell>Message Preview</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {messages
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((message) => (
              <TableRow key={message.id} sx={{ backgroundColor: message.status === 'unread' ? 'rgba(255, 193, 7, 0.1)' : 'inherit' }}>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(message.created_at)}
                  </Typography>
                </TableCell>
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
                  <Typography 
                    variant="body2" 
                    fontWeight={message.status === 'unread' ? 'bold' : 'normal'}
                    sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
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
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewMessage(message)}
                      title="View Message"
                      color="info"
                    >
                      <ViewIcon />
                    </IconButton>
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
                      onClick={() => handleArchive(message)}
                      title="Archive"
                      disabled={message.status === 'archived'}
                    >
                      <ArchiveIcon />
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

      {/* Message Details Modal */}
      <Dialog open={showMessageModal} onClose={() => setShowMessageModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">From</Typography>
                <Typography variant="body1">
                  {selectedMessage.sender?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMessage.sender?.email || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">To</Typography>
                <Typography variant="body1">
                  {selectedMessage.recipient?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMessage.recipient?.email || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedMessage.status || 'unread'}
                  color={getStatusColor(selectedMessage.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Sent At</Typography>
                <Typography variant="body1">{formatDateTime(selectedMessage.created_at)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Message</Typography>
                <Box sx={{ 
                  mt: 1, 
                  p: 2, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  backgroundColor: '#f9f9f9',
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedMessage.message || 'No message content'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMessageModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
