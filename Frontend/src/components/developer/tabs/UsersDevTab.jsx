import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Edit as EditIcon, LockReset as ResetIcon, Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, Business as BusinessIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getAllUsersGlobal, deactivateUserGlobal, getCompaniesLight, updateUserRoleGlobal } from '../../../supabase/api';
import { ModernSelect, ModernTextField, ModernButton } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function UsersDevTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Modal states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Create user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin',
    company_id: '',
    status: 'Active'
  });

  const load = async () => {
    setLoading(true);
    const res = await getAllUsersGlobal();
    setRows(res.data || []);
    const cl = await getCompaniesLight();
    setCompanies(cl.data || []);
    setLoading(false);
  };

  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);

  const inRange = (d) => {
    const ts = d ? new Date(d).getTime() : null;
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() : null;
    if (ts == null) return true;
    if (fromTs != null && ts < fromTs) return false;
    if (toTs != null && ts > toTs) return false;
    return true;
  };

  const filtered = rows.filter(r => (
    (companyFilter ? r.company_id === companyFilter : true) &&
    (roleFilter ? r.role === roleFilter : true) &&
    (statusFilter ? (statusFilter === 'active' ? r.is_active : !r.is_active) : true) &&
    ((searchName || '').trim() === '' ? true : (r.name || '').toLowerCase().includes(searchName.toLowerCase())) &&
    ((searchEmail || '').trim() === '' ? true : (r.email || '').toLowerCase().includes(searchEmail.toLowerCase())) &&
    inRange(r.last_login)
  ));

  const exportCSV = () => {
    if (!filtered.length) return;
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateUser = async () => {
    try {
      // TODO: Implement create user functionality
      console.log('Creating user:', newUser);
      setShowCreateUser(false);
      setNewUser({ name: '', email: '', phone: '', role: 'admin', company_id: '', status: 'Active' });
      load();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const handleResetPassword = async (userId) => {
    try {
      // TODO: Implement password reset functionality
      console.log('Resetting password for user:', userId);
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const actions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewUser(row),
      color: 'primary'
    },
    { 
      label: 'Edit', 
      icon: <EditIcon />, 
      onClick: async ({ row }) => { 
        // TODO: Implement edit functionality
        console.log('Edit user:', row);
      },
      color: 'info'
    },
    { 
      label: 'Reset Password', 
      icon: <ResetIcon />, 
      onClick: async ({ row }) => { 
        await handleResetPassword(row.user_id);
      },
      color: 'warning'
    },
    { 
      label: row => row.is_active ? 'Suspend' : 'Activate', 
      icon: row => row.is_active ? 'error' : 'success', 
      onClick: async ({ row }) => { 
        await deactivateUserGlobal(row.user_id); 
        load(); 
      }, 
      color: row => row.is_active ? 'error' : 'success'
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Users
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateUser(true)}
          >
            Create User
          </Button>
          <Button
            variant="outlined"
            onClick={exportCSV}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Search by Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Search by Email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Company</InputLabel>
                <Select
                  value={companyFilter}
                  label="Company"
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {companies.map(c => (
                    <MenuItem key={c.company_id} value={c.company_id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="ops_manager">Operations Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="developer">Developer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
      <DataTable
        data={filtered}
        loading={loading}
        columns={[
              { 
                field: 'name', 
                headerName: 'Name', 
                sortable: true,
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'email', 
                headerName: 'Email',
                sortable: true,
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    {params.value}
                  </Box>
                )
              },
              { 
                field: 'role', 
                headerName: 'Role',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    color={params.value === 'admin' ? 'primary' : params.value === 'developer' ? 'secondary' : 'default'}
                    size="small"
                    icon={<AdminIcon />}
                  />
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
                      {company?.name || 'N/A'}
                    </Box>
                  );
                }
              },
              { 
                field: 'is_active', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value ? 'Active' : 'Inactive'} 
                    color={params.value ? 'success' : 'error'}
                    size="small"
                  />
                )
              },
              { field: 'last_login', headerName: 'Last Login', type: 'date', sortable: true },
            ]}
            rowActions={actions}
        searchable
        pagination
      />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={showCreateUser} onClose={() => setShowCreateUser(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="ops_manager">Operations Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="developer">Developer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assign to Company</InputLabel>
                <Select
                  value={newUser.company_id}
                  label="Assign to Company"
                  onChange={(e) => setNewUser({...newUser, company_id: e.target.value})}
                >
                  <MenuItem value="">No Company</MenuItem>
                  {companies.map(c => (
                    <MenuItem key={c.company_id} value={c.company_id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newUser.status}
                  label="Status"
                  onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateUser(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create User</Button>
        </DialogActions>
      </Dialog>

      {/* User Profile Modal */}
      <Dialog open={showUserProfile} onClose={() => setShowUserProfile(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            {selectedUser?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{selectedUser.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedUser.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                <Chip 
                  label={selectedUser.role} 
                  color={selectedUser.role === 'admin' ? 'primary' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                <Typography variant="body1">
                  {companies.find(c => c.company_id === selectedUser.company_id)?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedUser.is_active ? 'Active' : 'Inactive'} 
                  color={selectedUser.is_active ? 'success' : 'error'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                <Typography variant="body1">
                  {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUserProfile(false)}>Close</Button>
          <Button variant="contained">Edit User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
