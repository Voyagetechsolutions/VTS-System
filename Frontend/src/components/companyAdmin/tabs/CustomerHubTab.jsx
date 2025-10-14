import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Chip, Avatar, Grid, Table, TableHead,
  TableRow, TableCell, TableBody, TablePagination, Stack, Divider, Alert, IconButton
} from '@mui/material';
import {
  Add as AddIcon, Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, People as PeopleIcon, Warning as WarningIcon, Repeat as RepeatIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function CustomerHubTab() {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active'
  });

  // Filter states
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalComplaints: 0,
    repeatCustomers: 0
  });

  // Customer details
  const [customerBookings, setCustomerBookings] = useState([]);
  const [customerComplaints, setCustomerComplaints] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);

  const loadCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          bookings:bookings(count),
          complaints:complaints(count)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to get counts
      const processedData = (data || []).map(customer => ({
        ...customer,
        bookings_count: customer.bookings?.[0]?.count || 0,
        complaints_count: customer.complaints?.[0]?.count || 0
      }));

      setCustomers(processedData);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }, [companyId, loadMetrics]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: totalCustomers },
        { count: activeCustomers },
        { count: totalComplaints },
        { data: repeatData }
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'Active'),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('bookings').select('customer_id').eq('company_id', companyId)
      ]);

      // Count repeat customers (customers with more than 1 booking)
      const customerBookingCounts = {};
      (repeatData || []).forEach(booking => {
        customerBookingCounts[booking.customer_id] = (customerBookingCounts[booking.customer_id] || 0) + 1;
      });
      const repeatCustomers = Object.values(customerBookingCounts).filter(count => count > 1).length;

      setMetrics({
        totalCustomers: totalCustomers || 0,
        activeCustomers: activeCustomers || 0,
        totalComplaints: totalComplaints || 0,
        repeatCustomers
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleAddCustomer = async () => {
    try {
      if (!customerForm.name || !customerForm.email) {
        alert('Name and Email are required');
        return;
      }

      const { error } = await supabase.from('customers').insert([{
        company_id: companyId,
        name: customerForm.name,
        email: customerForm.email.toLowerCase(),
        phone: customerForm.phone,
        address: customerForm.address,
        status: customerForm.status
      }]);

      if (error) throw error;

      setShowAddCustomer(false);
      setCustomerForm({ name: '', email: '', phone: '', address: '', status: 'Active' });
      loadCustomers();
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer: ' + error.message);
    }
  };

  const handleEditCustomer = async () => {
    try {
      if (!selectedCustomer || !customerForm.name || !customerForm.email) {
        alert('Name and Email are required');
        return;
      }

      const { error } = await supabase.from('customers').update({
        name: customerForm.name,
        email: customerForm.email.toLowerCase(),
        phone: customerForm.phone,
        address: customerForm.address,
        status: customerForm.status
      }).eq('id', selectedCustomer.id);

      if (error) throw error;

      setShowEditCustomer(false);
      setSelectedCustomer(null);
      setCustomerForm({ name: '', email: '', phone: '', address: '', status: 'Active' });
      loadCustomers();
      alert('Customer updated successfully!');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error updating customer: ' + error.message);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}?`)) return;

    try {
      const { error } = await supabase.from('customers').delete().eq('id', customer.id);
      if (error) throw error;
      loadCustomers();
      alert('Customer deleted successfully!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer: ' + error.message);
    }
  };

  const handleViewDetails = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const [bookingsRes, complaintsRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('complaints').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false })
      ]);

      setCustomerBookings(bookingsRes.data || []);
      setCustomerComplaints(complaintsRes.data || []);

      // Calculate total spent
      const total = (bookingsRes.data || [])
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + (parseFloat(booking.amount) || 0), 0);
      setTotalSpent(total);

      setShowViewDetails(true);
    } catch (error) {
      console.error('Error loading customer details:', error);
    }
  };

  const handleEditProfile = (customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      status: customer.status
    });
    setShowEditCustomer(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'warning';
      case 'Suspended': return 'error';
      default: return 'default';
    }
  };

  const filteredCustomers = customers.filter(customer =>
    (searchName ? customer.name?.toLowerCase().includes(searchName.toLowerCase()) : true) &&
    (searchEmail ? customer.email?.toLowerCase().includes(searchEmail.toLowerCase()) : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customer Hub
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddCustomer(true)}
        >
          + Add Customer
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalCustomers}</Typography>
              <Typography variant="body2" color="text.secondary">Total Customers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.activeCustomers}</Typography>
              <Typography variant="body2" color="text.secondary">Active Customers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.totalComplaints}</Typography>
              <Typography variant="body2" color="text.secondary">Total Complaints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <RepeatIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.repeatCustomers}</Typography>
              <Typography variant="body2" color="text.secondary">Repeat Customers</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by Email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Customer List</Typography>
          {filteredCustomers.length === 0 ? (
            <Alert severity="info">
              No customers found. Add your first customer using the + Add Customer button.
            </Alert>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Bookings</TableCell>
                    <TableCell>Complaints</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                              {customer.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {customer.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {customer.bookings_count || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {customer.complaints_count || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.status}
                            color={getStatusColor(customer.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(customer)}
                              title="View Details"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditProfile(customer)}
                              title="Edit"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCustomer(customer)}
                              title="Delete"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredCustomers.length}
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
          )}
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      <Dialog open={showAddCustomer} onClose={() => setShowAddCustomer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={customerForm.status}
                  label="Status"
                  onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCustomer(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} variant="contained">Add Customer</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={showEditCustomer} onClose={() => setShowEditCustomer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={customerForm.status}
                  label="Status"
                  onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditCustomer(false)}>Cancel</Button>
          <Button onClick={handleEditCustomer} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={showViewDetails} onClose={() => setShowViewDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCustomer ? `${selectedCustomer.name} - Customer Details` : 'Customer Details'}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedCustomer.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{selectedCustomer.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Address</Typography>
                  <Typography variant="body1">{selectedCustomer.address || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Total Spent</Typography>
                  <Typography variant="body1" color="primary" fontWeight="bold">
                    ${totalSpent.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Booking History</Typography>
              <Table size="small" sx={{ mb: 3 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Booking ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No bookings found</TableCell>
                    </TableRow>
                  ) : (
                    customerBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.id}</TableCell>
                        <TableCell>${parseFloat(booking.amount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip label={booking.status} size="small" />
                        </TableCell>
                        <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Typography variant="h6" gutterBottom>Complaint Records</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Details</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerComplaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No complaints found</TableCell>
                    </TableRow>
                  ) : (
                    customerComplaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell>{complaint.details}</TableCell>
                        <TableCell>
                          <Chip label={complaint.status} size="small" />
                        </TableCell>
                        <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDetails(false)}>Close</Button>
          <Button
            onClick={() => {
              setShowViewDetails(false);
              handleEditProfile(selectedCustomer);
            }}
            variant="contained"
          >
            Edit Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
