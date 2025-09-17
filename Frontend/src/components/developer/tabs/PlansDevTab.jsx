import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, IconButton, Tooltip, Alert } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, MonetizationOn as MonetizationOnIcon, Check as CheckIcon, Close as CloseIcon, Star as StarIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';

export default function PlansDevTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Create/Edit plan form state
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly',
    features: {
      maxBuses: '',
      maxUsers: '',
      maxBranches: '',
      maxTickets: '',
      supportLevel: 'basic',
      customBranding: false,
      apiAccess: false,
      analytics: false,
      prioritySupport: false
    },
    status: 'active'
  });

  const load = async () => {
    setLoading(true);
    try {
      // Mock plans data - replace with actual API call
      const mockPlans = [
        {
          id: 1,
          name: 'Basic',
          description: 'Perfect for small bus companies just getting started',
          price: 300,
          billingCycle: 'monthly',
          features: {
            maxBuses: 5,
            maxUsers: 10,
            maxBranches: 2,
            maxTickets: 1000,
            supportLevel: 'basic',
            customBranding: false,
            apiAccess: false,
            analytics: false,
            prioritySupport: false
          },
          status: 'active',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Standard',
          description: 'Ideal for growing bus companies with multiple routes',
          price: 500,
          billingCycle: 'monthly',
          features: {
            maxBuses: 20,
            maxUsers: 50,
            maxBranches: 5,
            maxTickets: 5000,
            supportLevel: 'standard',
            customBranding: true,
            apiAccess: true,
            analytics: true,
            prioritySupport: false
          },
          status: 'active',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Premium',
          description: 'Advanced features for large bus companies and enterprises',
          price: 700,
          billingCycle: 'monthly',
          features: {
            maxBuses: -1, // Unlimited
            maxUsers: -1, // Unlimited
            maxBranches: -1, // Unlimited
            maxTickets: -1, // Unlimited
            supportLevel: 'premium',
            customBranding: true,
            apiAccess: true,
            analytics: true,
            prioritySupport: true
          },
          status: 'active',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ];
      setPlans(mockPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreatePlan = async () => {
    try {
      // TODO: Implement create plan functionality
      console.log('Creating plan:', planForm);
      setShowCreatePlan(false);
      resetForm();
      load();
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleEditPlan = async () => {
    try {
      // TODO: Implement edit plan functionality
      console.log('Editing plan:', selectedPlan.id, planForm);
      setShowEditPlan(false);
      resetForm();
      load();
    } catch (error) {
      console.error('Error editing plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      // TODO: Implement delete plan functionality
      console.log('Deleting plan:', planId);
      load();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleToggleStatus = async (planId, currentStatus) => {
    try {
      // TODO: Implement toggle status functionality
      console.log('Toggling status for plan:', planId, currentStatus);
      load();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const resetForm = () => {
    setPlanForm({
      name: '',
      description: '',
      price: '',
      billingCycle: 'monthly',
      features: {
        maxBuses: '',
        maxUsers: '',
        maxBranches: '',
        maxTickets: '',
        supportLevel: 'basic',
        customBranding: false,
        apiAccess: false,
        analytics: false,
        prioritySupport: false
      },
      status: 'active'
    });
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      billingCycle: plan.billingCycle,
      features: { ...plan.features },
      status: plan.status
    });
    setShowEditPlan(true);
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getSupportLevelColor = (level) => {
    switch (level) {
      case 'basic': return 'default';
      case 'standard': return 'primary';
      case 'premium': return 'secondary';
      default: return 'default';
    }
  };

  const formatLimit = (limit) => {
    return limit === -1 ? 'Unlimited' : limit.toString();
  };

  const actions = [
    { 
      label: 'Edit', 
      icon: <EditIcon />, 
      onClick: ({ row }) => openEditModal(row),
      color: 'primary'
    },
    { 
      label: row => row.status === 'active' ? 'Archive' : 'Activate', 
      icon: row => row.status === 'active' ? <CloseIcon /> : <CheckIcon />, 
      onClick: async ({ row }) => { 
        await handleToggleStatus(row.id, row.status);
      },
      color: row => row.status === 'active' ? 'warning' : 'success'
    },
    { 
      label: 'Delete', 
      icon: <DeleteIcon />, 
      onClick: async ({ row }) => { 
        await handleDeletePlan(row.id);
      },
      color: 'error'
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Subscription Plans
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreatePlan(true)}
        >
          Create Plan
        </Button>
      </Box>

      {/* Plans Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {plan.name}
                  </Typography>
                  <Chip 
                    label={plan.status} 
                    color={getStatusColor(plan.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>
                <Typography variant="h4" color="primary" sx={{ mb: 2 }}>
                  R{plan.price}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /{plan.billingCycle}
                  </Typography>
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Features:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • {formatLimit(plan.features.maxBuses)} Buses
                  </Typography>
                  <Typography variant="body2">
                    • {formatLimit(plan.features.maxUsers)} Users
                  </Typography>
                  <Typography variant="body2">
                    • {formatLimit(plan.features.maxBranches)} Branches
                  </Typography>
                  <Typography variant="body2">
                    • {formatLimit(plan.features.maxTickets)} Tickets/month
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openEditModal(plan)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color={plan.status === 'active' ? 'warning' : 'success'}
                    onClick={() => handleToggleStatus(plan.id, plan.status)}
                  >
                    {plan.status === 'active' ? 'Archive' : 'Activate'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Plans Table */}
      <Card>
        <CardContent>
          <DataTable
            data={plans}
            loading={loading}
            columns={[
              { 
                field: 'name', 
                headerName: 'Plan Name', 
                sortable: true,
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MonetizationOnIcon color="primary" />
                    <Typography variant="body2" fontWeight="bold">
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'description', 
                headerName: 'Description',
                renderCell: (params) => (
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'price', 
                headerName: 'Price',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="bold">
                    R{params.value}/{params.row.billingCycle}
                  </Typography>
                )
              },
              { 
                field: 'features.maxBuses', 
                headerName: 'Max Buses',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {formatLimit(params.value)}
                  </Typography>
                )
              },
              { 
                field: 'features.maxUsers', 
                headerName: 'Max Users',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {formatLimit(params.value)}
                  </Typography>
                )
              },
              { 
                field: 'features.supportLevel', 
                headerName: 'Support',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    color={getSupportLevelColor(params.value)}
                    size="small"
                  />
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
                  />
                )
              },
            ]}
            rowActions={actions}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Create Plan Modal */}
      <Dialog open={showCreatePlan} onClose={() => setShowCreatePlan(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Subscription Plan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Plan Name"
                value={planForm.name}
                onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (R)"
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={planForm.description}
                onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Billing Cycle</InputLabel>
                <Select
                  value={planForm.billingCycle}
                  label="Billing Cycle"
                  onChange={(e) => setPlanForm({...planForm, billingCycle: e.target.value})}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="annually">Annually</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={planForm.status}
                  label="Status"
                  onChange={(e) => setPlanForm({...planForm, status: e.target.value})}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Features Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Plan Features & Limits</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Buses"
                type="number"
                value={planForm.features.maxBuses}
                onChange={(e) => setPlanForm({
                  ...planForm, 
                  features: {...planForm.features, maxBuses: e.target.value}
                })}
                helperText="Use -1 for unlimited"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Users"
                type="number"
                value={planForm.features.maxUsers}
                onChange={(e) => setPlanForm({
                  ...planForm, 
                  features: {...planForm.features, maxUsers: e.target.value}
                })}
                helperText="Use -1 for unlimited"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Branches"
                type="number"
                value={planForm.features.maxBranches}
                onChange={(e) => setPlanForm({
                  ...planForm, 
                  features: {...planForm.features, maxBranches: e.target.value}
                })}
                helperText="Use -1 for unlimited"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Tickets/Month"
                type="number"
                value={planForm.features.maxTickets}
                onChange={(e) => setPlanForm({
                  ...planForm, 
                  features: {...planForm.features, maxTickets: e.target.value}
                })}
                helperText="Use -1 for unlimited"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Support Level</InputLabel>
                <Select
                  value={planForm.features.supportLevel}
                  label="Support Level"
                  onChange={(e) => setPlanForm({
                    ...planForm, 
                    features: {...planForm.features, supportLevel: e.target.value}
                  })}
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Feature Toggles */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Additional Features</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={planForm.features.customBranding}
                    onChange={(e) => setPlanForm({
                      ...planForm, 
                      features: {...planForm.features, customBranding: e.target.checked}
                    })}
                  />
                }
                label="Custom Branding"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={planForm.features.apiAccess}
                    onChange={(e) => setPlanForm({
                      ...planForm, 
                      features: {...planForm.features, apiAccess: e.target.checked}
                    })}
                  />
                }
                label="API Access"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={planForm.features.analytics}
                    onChange={(e) => setPlanForm({
                      ...planForm, 
                      features: {...planForm.features, analytics: e.target.checked}
                    })}
                  />
                }
                label="Advanced Analytics"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={planForm.features.prioritySupport}
                    onChange={(e) => setPlanForm({
                      ...planForm, 
                      features: {...planForm.features, prioritySupport: e.target.checked}
                    })}
                  />
                }
                label="Priority Support"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreatePlan(false)}>Cancel</Button>
          <Button onClick={handleCreatePlan} variant="contained">Create Plan</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={showEditPlan} onClose={() => setShowEditPlan(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Subscription Plan</DialogTitle>
        <DialogContent>
          {/* Same form as create, but with existing data */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Plan Name"
                value={planForm.name}
                onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (R)"
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={planForm.description}
                onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                required
              />
            </Grid>
            {/* Include all other form fields from create modal */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditPlan(false)}>Cancel</Button>
          <Button onClick={handleEditPlan} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
