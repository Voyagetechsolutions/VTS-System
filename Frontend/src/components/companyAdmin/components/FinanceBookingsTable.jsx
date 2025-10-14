import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Card, CardContent, Chip, IconButton, TextField, InputAdornment
} from '@mui/material';
import {
  Visibility as ViewIcon, Cancel as CancelIcon, Undo as RefundIcon,
  Search as SearchIcon
} from '@mui/icons-material';

export default function FinanceBookingsTable({ data, loading }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 25); // Mock $25 per booking
  };

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

  const handleViewDetails = (booking) => {
    // Mock view details
    alert(`Viewing details for Booking ID: ${booking.id.slice(0, 8)}...`);
  };

  const handleCancelRefund = (booking) => {
    // Mock cancel/refund process
    const action = booking.status === 'Confirmed' ? 'refund' : 'cancel';
    if (window.confirm(`Are you sure you want to ${action} this booking?`)) {
      alert(`Booking ${booking.id.slice(0, 8)}... ${action} initiated`);
    }
  };

  const filteredData = data.filter(booking =>
    booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Bookings</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading bookings data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Bookings</Typography>
          <TextField
            size="small"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
        </Box>
        
        {filteredData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {data.length === 0 ? 'No bookings data available' : 'No bookings match your search'}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Booking ID</TableCell>
                    <TableCell>Passenger</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((booking) => (
                    <TableRow 
                      key={booking.id} 
                      hover
                      sx={{ 
                        backgroundColor: booking.status === 'Cancelled' ? 'rgba(255, 0, 0, 0.05)' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {booking.id.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.passenger_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(booking.booking_datetime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium" 
                          color={booking.status === 'Confirmed' ? 'success.main' : 'text.secondary'}
                        >
                          {booking.status === 'Confirmed' ? formatCurrency(25) : '-'}
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
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(booking)}
                          title="View Details"
                          color="info"
                        >
                          <ViewIcon />
                        </IconButton>
                        {booking.status !== 'Cancelled' && (
                          <IconButton
                            size="small"
                            onClick={() => handleCancelRefund(booking)}
                            title={booking.status === 'Confirmed' ? 'Refund' : 'Cancel'}
                            color={booking.status === 'Confirmed' ? 'warning' : 'error'}
                          >
                            {booking.status === 'Confirmed' ? <RefundIcon /> : <CancelIcon />}
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={filteredData.length}
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

            {/* Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Revenue: {formatCurrency(filteredData.filter(b => b.status === 'Confirmed').length * 25)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmed: {filteredData.filter(b => b.status === 'Confirmed').length} | 
                Pending: {filteredData.filter(b => b.status === 'Pending').length} | 
                Cancelled: {filteredData.filter(b => b.status === 'Cancelled').length}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
