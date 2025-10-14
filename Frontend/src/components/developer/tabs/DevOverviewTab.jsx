import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Avatar, IconButton } from '@mui/material';
import { Business as BusinessIcon, People as PeopleIcon, Announcement as AnnouncementIcon, MonetizationOn as MonetizationOnIcon, DirectionsBus as BusIcon, AttachMoney as MoneyIcon, Notifications as NotificationsIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getPlatformMetrics, getActivityLogGlobal, getCompaniesLight, createCompany, createUser, createAnnouncement } from '../../../supabase/api';

export default function DevOverviewTab() {
  const [metrics, setMetrics] = useState({ companies: 0, users: 0, buses: 0, routes: 0, bookingsAll: 0, bookingsMonth: 0, revenueAll: 0 });
  const [activity, setActivity] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // Modal states
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showManagePlans, setShowManagePlans] = useState(false);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showSendAnnouncement, setShowSendAnnouncement] = useState(false);
  
  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'Basic',
    status: 'Active'
  });
  
  const [planForm, setPlanForm] = useState({
    selectedPlan: '',
    name: '',
    price: '',
    features: '',
    status: 'Active'
  });
  
  const [userForm, setUserForm] = useState({
    selectedCompany: '',
    name: '',
    email: '',
    role: 'admin',
    status: 'Active'
  });
  
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    deliveryMethod: 'dashboard'
  });

  const loadData = async () => {
    try { 
      const m = await getPlatformMetrics(); 
      if (m?.data) setMetrics(m.data); 
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
    try { 
      const a = await getActivityLogGlobal(); 
      setActivity(a.data || []); 
    } catch (error) {
      console.error('Error loading activity:', error);
    }
    try {
      const c = await getCompaniesLight();
      setCompanies(c.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadData();
    };
    load();
  }, []);

  const handleCreateCompany = async () => {
    try {
      await createCompany({
        name: companyForm.name,
        email: companyForm.email,
        phone: companyForm.phone,
        address: companyForm.address,
        subscription_plan: companyForm.plan,
        is_active: companyForm.status === 'Active'
      });
      setShowCreateCompany(false);
      setCompanyForm({ name: '', email: '', phone: '', address: '', plan: 'Basic', status: 'Active' });
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Error creating company: ' + error.message);
    }
  };

  const handleManagePlans = async () => {
    try {
      // Plans are managed through platform settings
      console.log('Managing plans:', planForm);
      setShowManagePlans(false);
      alert('Plan management is available in the Settings tab');
    } catch (error) {
      console.error('Error managing plans:', error);
    }
  };

  const handleManageUsers = async () => {
    try {
      if (!userForm.selectedCompany || !userForm.name || !userForm.email) {
        alert('Please fill in all required fields');
        return;
      }
      await createUser({
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        company_id: userForm.selectedCompany,
        is_active: userForm.status === 'Active'
      });
      setShowManageUsers(false);
      setUserForm({ selectedCompany: '', name: '', email: '', role: 'admin', status: 'Active' });
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + error.message);
    }
  };

  const handleSendAnnouncement = async () => {
    try {
      if (!announcementForm.title || !announcementForm.message) {
        alert('Please fill in title and message');
        return;
      }
      await createAnnouncement({
        title: announcementForm.title,
        message: announcementForm.message,
        target_audience: announcementForm.targetAudience,
        delivery_method: announcementForm.deliveryMethod,
        priority: 'normal'
      });
      setShowSendAnnouncement(false);
      setAnnouncementForm({ title: '', message: '', targetAudience: 'all', deliveryMethod: 'dashboard' });
      alert('Announcement created successfully!');
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Error sending announcement: ' + error.message);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Developer Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton>
            <NotificationsIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Top KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary" fontWeight="bold">
                {metrics.companies}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Companies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" color="secondary" fontWeight="bold">
                {metrics.users}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <BusIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {metrics.buses}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Buses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
          }}>
            <CardContent>
              <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                R{metrics.revenueAll?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Management Actions */}
      <Typography variant="h5" sx={{ mb: 2 }}>Quick Management Actions</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => setShowCreateCompany(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Create Company
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add a new company to the platform
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => setShowManagePlans(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <MonetizationOnIcon sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Manage Plans
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create and edit subscription plans
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => setShowManageUsers(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Manage Users
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add, edit, or manage platform users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
            onClick={() => setShowSendAnnouncement(true)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <AnnouncementIcon sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Send Announcement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Send platform-wide notifications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Typography variant="h5" sx={{ mb: 2 }}>Recent Activity</Typography>
      <Card>
        <CardContent>
          {activity.length > 0 ? (
            <DataTable
              data={activity.slice(0, 10)}
              loading={false}
              columns={[
                { 
                  field: 'created_at', 
                  headerName: 'Timestamp', 
                  type: 'date',
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {new Date(params.value).toLocaleString()}
                      </Typography>
                    </Box>
                  )
                },
                { 
                  field: 'type', 
                  headerName: 'Action',
                  renderCell: (params) => (
                    <Typography variant="body2" fontWeight="medium">
                      {params.value}
                    </Typography>
                  )
                },
                { 
                  field: 'company_id', 
                  headerName: 'Company',
                  renderCell: (params) => {
                    const company = companies.find(c => c.company_id === params.value);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {company?.name || 'Unknown'}
                        </Typography>
                      </Box>
                    );
                  }
                },
                { 
                  field: 'message', 
                  headerName: 'Details',
                  renderCell: (params) => (
                    <Typography variant="body2" color="text.secondary">
                      {params.value}
                    </Typography>
                  )
                },
              ]}
              searchable={false}
              pagination={false}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No data available
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Company Modal */}
      <Dialog open={showCreateCompany} onClose={() => setShowCreateCompany(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Company</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({...companyForm, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={companyForm.address}
                onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Plan</InputLabel>
                <Select
                  value={companyForm.plan}
                  label="Default Plan"
                  onChange={(e) => setCompanyForm({...companyForm, plan: e.target.value})}
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={companyForm.status}
                  label="Status"
                  onChange={(e) => setCompanyForm({...companyForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateCompany(false)}>Cancel</Button>
          <Button onClick={handleCreateCompany} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Manage Plans Modal */}
      <Dialog open={showManagePlans} onClose={() => setShowManagePlans(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Plans</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Plan</InputLabel>
                <Select
                  value={planForm.selectedPlan}
                  label="Select Plan"
                  onChange={(e) => setPlanForm({...planForm, selectedPlan: e.target.value})}
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plan Name"
                value={planForm.name}
                onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Features"
                multiline
                rows={3}
                value={planForm.features}
                onChange={(e) => setPlanForm({...planForm, features: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowManagePlans(false)}>Cancel</Button>
          <Button onClick={handleManagePlans} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Manage Users Modal */}
      <Dialog open={showManageUsers} onClose={() => setShowManageUsers(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Users</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Company</InputLabel>
                <Select
                  value={userForm.selectedCompany}
                  label="Select Company"
                  onChange={(e) => setUserForm({...userForm, selectedCompany: e.target.value})}
                >
                  {companies.map(company => (
                    <MenuItem key={company.company_id} value={company.company_id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role}
                  label="Role"
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="ops_manager">Operations Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={userForm.status}
                  label="Status"
                  onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowManageUsers(false)}>Cancel</Button>
          <Button onClick={handleManageUsers} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Send Announcement Modal */}
      <Dialog open={showSendAnnouncement} onClose={() => setShowSendAnnouncement(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Announcement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message Body"
                multiline
                rows={4}
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={announcementForm.targetAudience}
                  label="Target Audience"
                  onChange={(e) => setAnnouncementForm({...announcementForm, targetAudience: e.target.value})}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="companies">Companies</MenuItem>
                  <MenuItem value="roles">Specific Roles</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Delivery Method</InputLabel>
                <Select
                  value={announcementForm.deliveryMethod}
                  label="Delivery Method"
                  onChange={(e) => setAnnouncementForm({...announcementForm, deliveryMethod: e.target.value})}
                >
                  <MenuItem value="dashboard">Dashboard</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSendAnnouncement(false)}>Cancel</Button>
          <Button onClick={handleSendAnnouncement} variant="contained">Send</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}