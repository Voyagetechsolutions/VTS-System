import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Card, CardContent, Chip, IconButton, TextField, InputAdornment
} from '@mui/material';
import {
  Receipt as ReceiptIcon, Undo as RefundIcon,
  CheckCircle as ReconcileIcon, Search as SearchIcon
} from '@mui/icons-material';

export default function PaymentsTable({ data, loading }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 25); // Mock $25 if no amount
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };

  const handleViewReceipt = (payment) => {
    // Mock receipt view
    alert(`Viewing receipt for Payment ID: ${payment.id.slice(0, 8)}...`);
  };

  const handleRefund = (payment) => {
    // Mock refund process
    if (window.confirm(`Are you sure you want to refund ${formatCurrency(payment.amount || 25)}?`)) {
      alert(`Refund initiated for Payment ID: ${payment.id.slice(0, 8)}...`);
    }
  };

  const handleReconcile = (payment) => {
    // Mock reconciliation
    alert(`Payment ${payment.id.slice(0, 8)}... marked as reconciled`);
  };

  const filteredData = data.filter(payment =>
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.booking?.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Payments</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading payments data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Payments</Typography>
          <TextField
            size="small"
            placeholder="Search payments..."
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
              {data.length === 0 ? 'No payments data available' : 'No payments match your search'}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>Booking ID</TableCell>
                    <TableCell>Passenger</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {payment.id.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {payment.booking_id?.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {payment.booking?.passenger_name || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.status} 
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(payment.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewReceipt(payment)}
                          title="View Receipt"
                          color="info"
                        >
                          <ReceiptIcon />
                        </IconButton>
                        {payment.status === 'Completed' && (
                          <IconButton
                            size="small"
                            onClick={() => handleRefund(payment)}
                            title="Refund"
                            color="warning"
                          >
                            <RefundIcon />
                          </IconButton>
                        )}
                        {payment.status === 'Completed' && (
                          <IconButton
                            size="small"
                            onClick={() => handleReconcile(payment)}
                            title="Mark as Reconciled"
                            color="success"
                          >
                            <ReconcileIcon />
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
                Total Payments: {formatCurrency(filteredData.reduce((sum, payment) => sum + (payment.amount || 25), 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed: {filteredData.filter(p => p.status === 'Completed').length} | 
                Pending: {filteredData.filter(p => p.status === 'Pending').length} | 
                Failed: {filteredData.filter(p => p.status === 'Failed').length}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
