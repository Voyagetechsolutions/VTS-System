import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography, Chip, Box, Divider, Card, CardContent, Avatar } from '@mui/material';
import { Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, Business as BusinessIcon, AdminPanelSettings as AdminIcon, LockReset as LockIcon, AccessTime as TimeIcon, Security as SecurityIcon } from '@mui/icons-material';

export default function UserProfileModal({ 
  open, 
  onClose, 
  user, 
  company,
  onEdit, 
  onResetPassword, 
  onSuspend, 
  onActivate 
}) {
  if (!user) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'primary';
      case 'ops_manager': return 'secondary';
      case 'booking_officer': return 'success';
      case 'driver': return 'info';
      case 'developer': return 'warning';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Admin';
      case 'ops_manager': return 'Operations Manager';
      case 'booking_officer': return 'Booking Officer';
      case 'driver': return 'Driver';
      case 'developer': return 'Developer';
      case 'hr_manager': return 'HR Manager';
      case 'finance_manager': return 'Finance Manager';
      case 'maintenance_manager': return 'Maintenance Manager';
      case 'depot_manager': return 'Depot Manager';
      case 'boarding_operator': return 'Boarding Operator';
      default: return role;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          {user.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* User Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{getRoleLabel(user.role)}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    </Box>
                    <Typography variant="body1">{user.email}</Typography>
                  </Grid>
                  {user.phone && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      </Box>
                      <Typography variant="body1">{user.phone}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                    </Box>
                    <Typography variant="body1">{company?.name || 'Unknown'}</Typography>
                  </Grid>
                  {user.employeeId && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Employee ID</Typography>
                      <Typography variant="body1">{user.employeeId}</Typography>
                    </Grid>
                  )}
                  {user.department && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Department</Typography>
                      <Typography variant="body1">{user.department}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Status & Permissions */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Status & Permissions</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AdminIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                    </Box>
                    <Chip 
                      label={getRoleLabel(user.role)} 
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                    <Chip 
                      label={user.status || (user.is_active ? 'Active' : 'Inactive')} 
                      color={getStatusColor(user.status || (user.is_active ? 'Active' : 'Inactive'))}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <SecurityIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Two-Factor Auth</Typography>
                    </Box>
                    <Chip 
                      label={user.twoFactorEnabled ? 'Enabled' : 'Disabled'} 
                      color={user.twoFactorEnabled ? 'success' : 'default'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Email Notifications</Typography>
                    <Chip 
                      label={user.emailNotifications ? 'Enabled' : 'Disabled'} 
                      color={user.emailNotifications ? 'success' : 'default'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>SMS Notifications</Typography>
                    <Chip 
                      label={user.smsNotifications ? 'Enabled' : 'Disabled'} 
                      color={user.smsNotifications ? 'success' : 'default'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Activity Information */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Activity Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                    </Box>
                    <Typography variant="body1">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Created On</Typography>
                    <Typography variant="body1">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Last Updated</Typography>
                    <Typography variant="body1">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Login Count</Typography>
                    <Typography variant="body1">{user.loginCount || 0}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          {user.recentActivity && user.recentActivity.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                  {user.recentActivity.map((activity, index) => (
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
        <Button variant="outlined" onClick={onEdit}>Edit User</Button>
        <Button variant="outlined" startIcon={<LockIcon />} onClick={onResetPassword}>
          Reset Password
        </Button>
        {user.is_active ? (
          <Button variant="contained" color="warning" onClick={onSuspend}>
            Suspend User
          </Button>
        ) : (
          <Button variant="contained" color="success" onClick={onActivate}>
            Activate User
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
