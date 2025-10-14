import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Grid, Box, Chip, Divider
} from '@mui/material';
import {
  Person as PersonIcon, EventSeat as SeatIcon, Business as BranchIcon,
  Route as RouteIcon, Schedule as TimeIcon
} from '@mui/icons-material';

export default function BookingDetailsModal({ open, booking, onClose }) {
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Booking Details</Typography>
          <Chip 
            label={booking.status} 
            color={getStatusColor(booking.status)}
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Passenger Information */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Passenger Information</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {booking.passenger_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Booking ID: {booking.id.slice(0, 8)}...
              </Typography>
            </Box>
          </Grid>

          {/* Seat Information */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SeatIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Seat Assignment</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                Seat {booking.seat_number || 'Not assigned'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Trip Information */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RouteIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Trip Information</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Route</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {booking.trip?.route ? 
                      `${booking.trip.route.pick_up} → ${booking.trip.route.drop_off}` : 
                      'Unknown Route'
                    }
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Bus</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {booking.trip?.bus?.name || booking.trip?.bus?.license_plate || 'Unknown Bus'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Departure</Typography>
                  <Typography variant="body1">
                    {booking.trip?.departure ? formatDateTime(booking.trip.departure) : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Arrival</Typography>
                  <Typography variant="body1">
                    {booking.trip?.arrival ? formatDateTime(booking.trip.arrival) : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Booking Information */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BranchIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Branch</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {booking.branch?.name || 'Unknown Branch'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Channel</Typography>
              <Chip 
                label={booking.channel || 'Unknown'} 
                size="small"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Booking Time</Typography>
              </Box>
              <Typography variant="body1">
                {formatDateTime(booking.booking_datetime)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Created</Typography>
              <Typography variant="body2">
                {formatDateTime(booking.created_at)}
              </Typography>
            </Box>
          </Grid>

          {/* Payment Status (Mock) */}
          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Payment Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={booking.status === 'Confirmed' ? 'Paid' : 'Pending Payment'} 
                  color={booking.status === 'Confirmed' ? 'success' : 'warning'}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  Amount: $25.00 (Mock)
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
