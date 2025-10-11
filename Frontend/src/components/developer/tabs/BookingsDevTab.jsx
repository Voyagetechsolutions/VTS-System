import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert, IconButton, Tooltip, Tabs, Tab } from '@mui/material';
import { Visibility as ViewIcon, Flag as FlagIcon, Send as SendIcon, Assessment as AssessmentIcon, Receipt as ReceiptIcon, Person as PersonIcon, Business as BusinessIcon, Route as RouteIcon, CreditCard as CreditCardIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, Pending as PendingIcon, Warning as WarningIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getCompaniesLight } from '../../../supabase/api';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function BookingsDevTab() {
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // Filter states
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingCompany, setBookingCompany] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [bookingDateFrom, setBookingDateFrom] = useState('');
  const [bookingDateTo, setBookingDateTo] = useState('');
  
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionCompany, setTransactionCompany] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [transactionDateFrom, setTransactionDateFrom] = useState('');
  const [transactionDateTo, setTransactionDateTo] = useState('');
  
  // Modal states
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    failedTransactions: 0,
    topRoutes: []
  });

  const load = async () => {
    setLoading(true);
    try {
      const companiesRes = await getCompaniesLight();
      setCompanies(companiesRes.data || []);
      // Clear mock data: initialize with empty datasets and zeroed analytics
      setBookings([]);
      setTransactions([]);
      setAnalytics({
        totalBookings: 0,
        totalRevenue: 0,
        failedTransactions: 0,
        topRoutes: []
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredBookings = bookings.filter(booking => (
    (bookingSearch ? 
      booking.id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      booking.passengerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      booking.passengerEmail.toLowerCase().includes(bookingSearch.toLowerCase())
      : true) &&
    (bookingCompany ? booking.companyId === bookingCompany : true) &&
    (bookingStatus ? booking.status === bookingStatus : true) &&
    (bookingDateFrom ? new Date(booking.bookingDate) >= new Date(bookingDateFrom) : true) &&
    (bookingDateTo ? new Date(booking.bookingDate) <= new Date(bookingDateTo) : true)
  ));

  const filteredTransactions = transactions.filter(transaction => (
    (transactionSearch ? 
      transaction.id.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      transaction.bookingId.toLowerCase().includes(transactionSearch.toLowerCase())
      : true) &&
    (transactionCompany ? transaction.companyId === transactionCompany : true) &&
    (paymentStatus ? transaction.status === paymentStatus : true) &&
    (transactionDateFrom ? new Date(transaction.transactionDate) >= new Date(transactionDateFrom) : true) &&
    (transactionDateTo ? new Date(transaction.transactionDate) <= new Date(transactionDateTo) : true)
  ));

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleFlagSuspicious = (item, type) => {
    setSelectedBooking(type === 'booking' ? item : null);
    setSelectedTransaction(type === 'transaction' ? item : null);
    setShowFlagModal(true);
  };

  const handleSendAlert = (item, type) => {
    setSelectedBooking(type === 'booking' ? item : null);
    setSelectedTransaction(type === 'transaction' ? item : null);
    setShowAlertModal(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'paid': return 'success';
      case 'cancelled': return 'error';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <CheckCircleIcon />;
      case 'paid': return <CheckCircleIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'failed': return <CancelIcon />;
      case 'pending': return <PendingIcon />;
      case 'refunded': return <WarningIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'card': return <CreditCardIcon />;
      case 'eft': return <ReceiptIcon />;
      case 'cash': return <ReceiptIcon />;
      default: return <CreditCardIcon />;
    }
  };

  const bookingActions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewBooking(row),
      color: 'primary'
    },
    { 
      label: 'Flag Suspicious', 
      icon: <FlagIcon />, 
      onClick: ({ row }) => handleFlagSuspicious(row, 'booking'),
      color: 'warning'
    },
    { 
      label: 'Send Alert', 
      icon: <SendIcon />, 
      onClick: ({ row }) => handleSendAlert(row, 'booking'),
      color: 'info'
    },
  ];

  const transactionActions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewTransaction(row),
      color: 'primary'
    },
    { 
      label: 'Flag Suspicious', 
      icon: <FlagIcon />, 
      onClick: ({ row }) => handleFlagSuspicious(row, 'transaction'),
      color: 'warning'
    },
    { 
      label: 'Send Alert', 
      icon: <SendIcon />, 
      onClick: ({ row }) => handleSendAlert(row, 'transaction'),
      color: 'info'
    },
  ];

  const exportBookings = () => {
    if (!filteredBookings.length) return;
    const csv = toCSV(filteredBookings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTransactions = () => {
    if (!filteredTransactions.length) return;
    const csv = toCSV(filteredTransactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Bookings & Transactions (System Overview)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              exportBookings();
              setTimeout(() => exportTransactions(), 100);
            }}
          >
            Export Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
          >
            Advanced Filters
          </Button>
        </Box>
      </Box>

      {/* Analytics Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="primary">{analytics.totalBookings}</Typography>
              <Typography variant="body2" color="text.secondary">Total Bookings</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="success.main">R{analytics.totalRevenue.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="error.main">{analytics.failedTransactions}</Typography>
              <Typography variant="body2" color="text.secondary">Failed Transactions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {analytics.failedTransactions > 0 ? 
                  ((analytics.failedTransactions / transactions.length) * 100).toFixed(1) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Failure Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Routes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Top 5 Routes by Bookings</Typography>
          <Grid container spacing={2}>
            {analytics.topRoutes.map((route, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="body2">{route.route}</Typography>
                  <Chip label={route.bookings} size="small" color="primary" />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for Bookings and Transactions */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Bookings" />
            <Tab label="Transactions" />
          </Tabs>
        </Box>

        {/* Bookings Tab */}
        {activeTab === 0 && (
          <CardContent>
            {/* Booking Filters */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search Booking ID/Passenger"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={bookingCompany}
                    label="Company"
                    onChange={(e) => setBookingCompany(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {companies.map(company => (
                      <MenuItem key={company.company_id} value={company.company_id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={bookingStatus}
                    label="Status"
                    onChange={(e) => setBookingStatus(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  onClick={exportBookings}
                  sx={{ height: '40px' }}
                >
                  Export CSV
                </Button>
              </Grid>
            </Grid>

            <DataTable
              data={filteredBookings}
              loading={loading}
              columns={[
                { 
                  field: 'id', 
                  headerName: 'Booking ID', 
                  sortable: true,
                  renderCell: (params) => (
                    <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {params.value}
                    </Typography>
                  )
                },
                { 
                  field: 'passengerName', 
                  headerName: 'Passenger',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      {params.value}
                    </Box>
                  )
                },
                { 
                  field: 'companyId', 
                  headerName: 'Company',
                  renderCell: (params) => {
                    const company = companies.find(c => c.company_id === params.value);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        {company?.name || 'Unknown'}
                      </Box>
                    );
                  }
                },
                { 
                  field: 'routeName', 
                  headerName: 'Route',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RouteIcon fontSize="small" color="action" />
                      {params.value}
                    </Box>
                  )
                },
                { 
                  field: 'bookingDate', 
                  headerName: 'Date', 
                  type: 'date', 
                  sortable: true 
                },
                { 
                  field: 'status', 
                  headerName: 'Status',
                  renderCell: (params) => (
                    <Chip 
                      label={params.value} 
                      color={getStatusColor(params.value)}
                      size="small"
                      icon={getStatusIcon(params.value)}
                    />
                  )
                },
                { 
                  field: 'amount', 
                  headerName: 'Amount',
                  renderCell: (params) => (
                    <Typography variant="body2" fontWeight="bold">
                      R{params.value}
                    </Typography>
                  )
                },
              ]}
              rowActions={bookingActions}
              searchable
              pagination
            />
          </CardContent>
        )}

        {/* Transactions Tab */}
        {activeTab === 1 && (
          <CardContent>
            {/* Transaction Filters */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search Transaction/Booking ID"
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={transactionCompany}
                    label="Company"
                    onChange={(e) => setTransactionCompany(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {companies.map(company => (
                      <MenuItem key={company.company_id} value={company.company_id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentStatus}
                    label="Payment Status"
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  onClick={exportTransactions}
                  sx={{ height: '40px' }}
                >
                  Export CSV
                </Button>
              </Grid>
            </Grid>

            <DataTable
              data={filteredTransactions}
              loading={loading}
              columns={[
                { 
                  field: 'id', 
                  headerName: 'Transaction ID', 
                  sortable: true,
                  renderCell: (params) => (
                    <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {params.value}
                    </Typography>
                  )
                },
                { 
                  field: 'companyId', 
                  headerName: 'Company',
                  renderCell: (params) => {
                    const company = companies.find(c => c.company_id === params.value);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        {company?.name || 'Unknown'}
                      </Box>
                    );
                  }
                },
                { 
                  field: 'bookingId', 
                  headerName: 'Booking ID',
                  renderCell: (params) => (
                    <Typography variant="body2" color="primary">
                      {params.value}
                    </Typography>
                  )
                },
                { 
                  field: 'paymentMethod', 
                  headerName: 'Payment Method',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPaymentMethodIcon(params.value)}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {params.value}
                      </Typography>
                    </Box>
                  )
                },
                { 
                  field: 'amount', 
                  headerName: 'Amount',
                  renderCell: (params) => (
                    <Typography variant="body2" fontWeight="bold">
                      R{params.value}
                    </Typography>
                  )
                },
                { 
                  field: 'status', 
                  headerName: 'Status',
                  renderCell: (params) => (
                    <Chip 
                      label={params.value} 
                      color={getStatusColor(params.value)}
                      size="small"
                      icon={getStatusIcon(params.value)}
                    />
                  )
                },
                { 
                  field: 'transactionDate', 
                  headerName: 'Date', 
                  type: 'date', 
                  sortable: true 
                },
              ]}
              rowActions={transactionActions}
              searchable
              pagination
            />
          </CardContent>
        )}
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetails} onClose={() => setShowBookingDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Booking Details - {selectedBooking?.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Booking ID</Typography>
                <Typography variant="body1">{selectedBooking.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Passenger</Typography>
                <Typography variant="body1">{selectedBooking.passengerName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedBooking.passengerEmail}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                <Typography variant="body1">
                  {companies.find(c => c.company_id === selectedBooking.companyId)?.name || 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Route</Typography>
                <Typography variant="body1">{selectedBooking.routeName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Seat Number</Typography>
                <Typography variant="body1">{selectedBooking.seatNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Travel Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedBooking.travelDate).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight="bold">R{selectedBooking.amount}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedBooking.status} 
                  color={getStatusColor(selectedBooking.status)}
                  size="small"
                  icon={getStatusIcon(selectedBooking.status)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                <Typography variant="body1">
                  {new Date(selectedBooking.createdAt).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBookingDetails(false)}>Close</Button>
          <Button variant="contained" color="warning">Flag as Suspicious</Button>
          <Button variant="contained" color="info">Send Alert to Company</Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={showTransactionDetails} onClose={() => setShowTransactionDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCardIcon />
            Transaction Details - {selectedTransaction?.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Transaction ID</Typography>
                <Typography variant="body1">{selectedTransaction.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Booking ID</Typography>
                <Typography variant="body1" color="primary">{selectedTransaction.bookingId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                <Typography variant="body1">
                  {companies.find(c => c.company_id === selectedTransaction.companyId)?.name || 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight="bold">R{selectedTransaction.amount}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {selectedTransaction.paymentMethod}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedTransaction.status} 
                  color={getStatusColor(selectedTransaction.status)}
                  size="small"
                  icon={getStatusIcon(selectedTransaction.status)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Gateway Response</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {selectedTransaction.gatewayResponse?.replace('_', ' ')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Transaction Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedTransaction.transactionDate).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransactionDetails(false)}>Close</Button>
          <Button variant="contained" color="warning">Flag as Suspicious</Button>
          <Button variant="contained" color="info">Send Alert to Company</Button>
        </DialogActions>
      </Dialog>

      {/* Flag Suspicious Modal */}
      <Dialog open={showFlagModal} onClose={() => setShowFlagModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Flag as Suspicious</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will mark the {selectedBooking ? 'booking' : 'transaction'} for audit review.
          </Alert>
          <TextField
            fullWidth
            label="Reason for Flagging"
            multiline
            rows={3}
            placeholder="Please provide details about why this item is suspicious..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFlagModal(false)}>Cancel</Button>
          <Button variant="contained" color="warning">Flag for Review</Button>
        </DialogActions>
      </Dialog>

      {/* Send Alert Modal */}
      <Dialog open={showAlertModal} onClose={() => setShowAlertModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Alert to Company</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Alert Message"
            multiline
            rows={4}
            placeholder="Enter the message to send to the company admin..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlertModal(false)}>Cancel</Button>
          <Button variant="contained" color="info">Send Alert</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}