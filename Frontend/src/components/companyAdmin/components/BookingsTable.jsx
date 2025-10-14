import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
  Edit as EditIcon, Visibility as ViewIcon, Cancel as CancelIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditBookingModal from './EditBookingModal';
import BookingDetailsModal from './BookingDetailsModal';

export default function BookingsTable({ bookings, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCancel = (booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      setCancelling(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      setShowCancelDialog(false);
      setSelectedBooking(null);
      onUpdate();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking: ' + error.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedBooking(null);
    onUpdate();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const paginatedBookings = bookings.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Passenger Name</TableCell>
              <TableCell>Seat Number</TableCell>
              <TableCell>Departure Date & Time</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBookings.map((booking) => (
              <TableRow 
                key={booking.id} 
                hover
                sx={{ 
                  backgroundColor: booking.status === 'Cancelled' ? 'rgba(255, 0, 0, 0.05)' : 'inherit'
                }}
              >
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {booking.passenger_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {booking.seat_number || 'Not assigned'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {booking.trip?.departure ? formatDateTime(booking.trip.departure) : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {booking.branch?.name || 'Unknown'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {booking.trip?.route ? 
                      `${booking.trip.route.pick_up} → ${booking.trip.route.drop_off}` : 
                      'Unknown Route'
                    }
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={booking.channel || 'Unknown'} 
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={booking.status} 
                    color={getStatusColor(booking.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleView(booking)}
                    title="View Details"
                    color="info"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(booking)}
                    title="Edit Booking"
                    disabled={booking.status === 'Cancelled'}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleCancel(booking)}
                    title="Cancel Booking"
                    color="error"
                    disabled={booking.status === 'Cancelled'}
                  >
                    <CancelIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={bookings.length}
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

      {/* Edit Booking Modal */}
      {selectedBooking && (
        <EditBookingModal
          open={showEditModal}
          booking={selectedBooking}
          onClose={handleModalClose}
        />
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          open={showDetailsModal}
          booking={selectedBooking}
          onClose={handleModalClose}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel the booking for "{selectedBooking?.passenger_name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>Keep Booking</Button>
          <Button 
            onClick={confirmCancel} 
            color="error" 
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
