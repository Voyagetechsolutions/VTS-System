import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Alert } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Edit as EditIcon, Send as SendIcon, Payment as PaymentIcon, Business as BusinessIcon, MonetizationOn as MonetizationOnIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getAllSubscriptionsGlobal, updateSubscription, getPaymentsGlobal, getAllCompaniesGlobal, suspendCompanyGlobal, activateCompanyGlobal } from '../../../supabase/api';

export default function BillingDevTab() {
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  
  // Modal states
  const [showBillingProfile, setShowBillingProfile] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showSendReminder, setShowSendReminder] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, i, c] = await Promise.all([
        getAllSubscriptionsGlobal(), 
        getPaymentsGlobal({}), 
        getAllCompaniesGlobal()
      ]);
      
      console.log('Subscriptions response:', s);
      console.log('Payments response:', i);
      console.log('Companies response:', c);
      
      if (s.error) console.error('Subscriptions error:', s.error);
      if (i.error) console.error('Payments error:', i.error);
      if (c.error) console.error('Companies error:', c.error);
      
      setSubs(s.data || []);
      setInvoices(i.data || []);
      setCompanies(c.data || []);
      
      console.log('Loaded subscriptions:', s.data?.length || 0);
      console.log('Loaded companies:', c.data?.length || 0);
    } catch (error) {
      console.error('Error loading billing data:', error);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredSubs = subs.filter(sub => {
    const company = companies.find(c => c.company_id === sub.company_id);
    return (
      (planFilter ? sub.plan === planFilter : true) &&
      (statusFilter ? sub.status === statusFilter : true) &&
      (paymentStatusFilter ? getPaymentStatus(sub) === paymentStatusFilter : true) &&
      (searchCompany ? (company?.name || '').toLowerCase().includes(searchCompany.toLowerCase()) : true)
    );
  });

  const getPaymentStatus = (sub) => {
    if (sub.status === 'suspended' || sub.status === 'cancelled') return 'Suspended';
    if (!sub.next_billing_date) return 'Paid';
    
    const nextBilling = new Date(sub.next_billing_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((nextBilling - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue <= 7) return 'Pending';
    return 'Paid';
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Overdue': return 'error';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <CheckCircleIcon />;
      case 'Overdue': return <WarningIcon />;
      case 'Pending': return <ScheduleIcon />;
      default: return <PaymentIcon />;
    }
  };

  const handleViewBilling = (company) => {
    setSelectedCompany(company);
    setShowBillingProfile(true);
  };

  const handleSendReminder = (company) => {
    setSelectedCompany(company);
    setShowSendReminder(true);
  };

  const handleMarkPaid = async (subscriptionId) => {
    try {
      await updateSubscription(subscriptionId, { status: 'Active' });
      load();
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const handleSuspendCompany = async (company_id) => {
    if (!window.confirm('Are you sure you want to suspend this company? All users will lose access.')) return;
    try {
      await suspendCompanyGlobal(company_id);
      alert('Company suspended successfully');
      load();
    } catch (error) {
      console.error('Error suspending company:', error);
      alert('Failed to suspend company');
    }
  };

  const handleActivateCompany = async (company_id) => {
    try {
      await activateCompanyGlobal(company_id);
      alert('Company activated successfully');
      load();
    } catch (error) {
      console.error('Error activating company:', error);
      alert('Failed to activate company');
    }
  };

  const actions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => {
        const company = companies.find(c => c.company_id === row.company_id);
        handleViewBilling(company);
      },
      color: 'primary'
    },
    { 
      label: 'Suspend Company', 
      icon: <WarningIcon />, 
      onClick: async ({ row }) => { 
        const company = companies.find(c => c.company_id === row.company_id);
        if (company?.is_active) {
          await handleSuspendCompany(row.company_id);
        }
      },
      color: 'error',
      show: ({ row }) => {
        const company = companies.find(c => c.company_id === row.company_id);
        return company?.is_active === true;
      }
    },
    { 
      label: 'Activate Company', 
      icon: <CheckCircleIcon />, 
      onClick: async ({ row }) => { 
        await handleActivateCompany(row.company_id);
      },
      color: 'success',
      show: ({ row }) => {
        const company = companies.find(c => c.company_id === row.company_id);
        return company?.is_active === false;
      }
    },
    { 
      label: 'Send Reminder', 
      icon: <SendIcon />, 
      onClick: ({ row }) => {
        const company = companies.find(c => c.company_id === row.company_id);
        handleSendReminder(company);
      },
      color: 'warning'
    },
    { 
      label: 'Mark Paid', 
      icon: <PaymentIcon />, 
      onClick: async ({ row }) => { 
        await handleMarkPaid(row.id);
      },
      color: 'success'
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Billing & Subscriptions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<MonetizationOnIcon />}
          >
            Export Reports
          </Button>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
          >
            Send Billing Reminder
          </Button>
        </Box>
      </Box>

      {/* Revenue Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="primary">
                {companies.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Companies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="success.main">
                R{subs.reduce((sum, sub) => sum + (sub.amount || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {subs.filter(sub => getPaymentStatus(sub) === 'Overdue').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Overdue Payments</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {subs.filter(sub => getPaymentStatus(sub) === 'Pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Pending Payments</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search by Company"
                value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Plan</InputLabel>
                <Select
                  value={planFilter}
                  label="Plan"
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Trial">Trial</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label="Payment Status"
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Paid">Up to Date</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Companies Billing Table */}
      <Card>
        <CardContent>
          <DataTable
            data={filteredSubs}
            loading={loading}
            columns={[
              { 
                field: 'company_id', 
                headerName: 'Company',
                renderCell: (params) => {
                  const company = companies.find(c => c.company_id === params.value);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon color="primary" />
                      <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {company?.name || 'Unknown Company'}
                      </Typography>
                    </Box>
                  );
                }
              },
              { 
                field: 'plan', 
                headerName: 'Plan',
                renderCell: (params) => (
                  <Chip 
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1) || 'N/A'} 
                    color={params.value === 'premium' ? 'primary' : params.value === 'standard' ? 'secondary' : 'default'}
                    size="small"
                  />
                )
              },
              { 
                field: 'next_billing_date', 
                headerName: 'Next Billing Date',
                type: 'date',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
                  </Typography>
                )
              },
              { 
                field: 'amount', 
                headerName: 'Amount',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="bold">
                    R{params.value?.toLocaleString() || '0'}
                  </Typography>
                )
              },
              { 
                field: 'status', 
                headerName: 'Payment Status',
                renderCell: (params) => {
                  const paymentStatus = getPaymentStatus(params.row);
                  return (
                    <Chip 
                      label={paymentStatus}
                      color={getPaymentStatusColor(paymentStatus)}
                      size="small"
                      icon={getPaymentStatusIcon(paymentStatus)}
                    />
                  );
                }
              },
            ]}
            rowActions={actions}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Company Billing Profile Modal */}
      <Dialog open={showBillingProfile} onClose={() => setShowBillingProfile(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon />
            {selectedCompany?.name} - Billing Profile
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCompany && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                <Typography variant="body1">{selectedCompany.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Contact Email</Typography>
                <Typography variant="body1">{selectedCompany.email}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Subscription Details</Typography>
                <Alert severity="info">
                  Current Plan: Premium | Next Billing: 2025-10-01 | Amount: R700
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Recent Invoices</Typography>
                <DataTable
                  data={invoices.filter(inv => inv.company_id === selectedCompany.company_id)}
                  loading={false}
                  columns={[
                    { field: 'id', headerName: 'Invoice #' },
                    { field: 'amount', headerName: 'Amount', type: 'currency' },
                    { field: 'status', headerName: 'Status', type: 'status' },
                    { field: 'created_at', headerName: 'Date', type: 'date' },
                  ]}
                  searchable={false}
                  pagination={false}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBillingProfile(false)}>Close</Button>
          <Button variant="contained">Change Plan</Button>
        </DialogActions>
      </Dialog>

      {/* Send Reminder Modal */}
      <Dialog open={showSendReminder} onClose={() => setShowSendReminder(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Billing Reminder</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Send a billing reminder to {selectedCompany?.name}?
          </Typography>
          <Alert severity="warning">
            This will send an email reminder about their upcoming or overdue payment.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSendReminder(false)}>Cancel</Button>
          <Button variant="contained" color="warning">Send Reminder</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
