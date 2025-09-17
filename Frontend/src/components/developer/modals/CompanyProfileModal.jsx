import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography, Chip, Box, Divider, Card, CardContent } from '@mui/material';
import { Business as BusinessIcon, Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon, Web as WebIcon, Receipt as ReceiptIcon, People as PeopleIcon, Assessment as AssessmentIcon } from '@mui/icons-material';

export default function CompanyProfileModal({ 
  open, 
  onClose, 
  company, 
  onEdit, 
  onSuspend, 
  onActivate 
}) {
  if (!company) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan?.toLowerCase()) {
      case 'premium': return 'primary';
      case 'standard': return 'secondary';
      case 'basic': return 'default';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          {company.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Company Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Company Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                    </Box>
                    <Typography variant="body1">{company.name}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    </Box>
                    <Typography variant="body1">{company.email}</Typography>
                  </Grid>
                  {company.phone && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      </Box>
                      <Typography variant="body1">{company.phone}</Typography>
                    </Grid>
                  )}
                  {company.address && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                      </Box>
                      <Typography variant="body1">{company.address}</Typography>
                    </Grid>
                  )}
                  {company.website && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <WebIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">Website</Typography>
                      </Box>
                      <Typography variant="body1" component="a" href={company.website} target="_blank" rel="noopener noreferrer">
                        {company.website}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Status & Plan Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Status & Plan</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AssessmentIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    </Box>
                    <Chip 
                      label={company.status || (company.is_active ? 'Active' : 'Inactive')} 
                      color={getStatusColor(company.status || (company.is_active ? 'Active' : 'Inactive'))}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ReceiptIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Plan</Typography>
                    </Box>
                    <Chip 
                      label={company.plan || 'Basic'} 
                      color={getPlanColor(company.plan)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Registration Number</Typography>
                    <Typography variant="body1">{company.registrationNumber || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Tax Number</Typography>
                    <Typography variant="body1">{company.taxNumber || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Created On</Typography>
                    <Typography variant="body1">
                      {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Last Updated</Typography>
                    <Typography variant="body1">
                      {company.updated_at ? new Date(company.updated_at).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Company Statistics */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Company Statistics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="primary">{company.totalUsers || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Users</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="secondary">{company.totalBuses || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Buses</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="success.main">{company.totalRoutes || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Routes</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="warning.main">{company.totalBookings || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Bookings</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          {company.recentActivity && company.recentActivity.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                  {company.recentActivity.map((activity, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(activity.timestamp).toLocaleString()}
                      </Typography>
                      <Typography variant="body1">{activity.action}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" onClick={onEdit}>Edit Company</Button>
        {company.is_active ? (
          <Button variant="contained" color="warning" onClick={onSuspend}>
            Suspend Company
          </Button>
        ) : (
          <Button variant="contained" color="success" onClick={onActivate}>
            Activate Company
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
