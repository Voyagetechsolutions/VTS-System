import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, Switch, FormControlLabel } from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon, Edit as EditIcon, Pause as PauseIcon, LockReset as LockResetIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function ProfilesTab() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Form states
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'Active'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const loadStaff = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('user_id, name, email, phone, role, department, is_active, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [companyId]);

  const handleAddStaff = async () => {
    try {
      if (!staffForm.name || !staffForm.email || !staffForm.role) return;
      await supabase.from('users').insert([{
        company_id: companyId,
        name: staffForm.name,
        email: staffForm.email.toLowerCase(),
        phone: staffForm.phone,
        role: staffForm.role,
        department: staffForm.department,
        is_active: staffForm.status === 'Active'
      }]);
      setShowAddStaff(false);
      setStaffForm({ name: '', email: '', phone: '', role: '', department: '', status: 'Active' });
      loadStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const handleEditStaff = async () => {
    try {
      if (!selectedStaff || !staffForm.name || !staffForm.email || !staffForm.role) return;
      await supabase.from('users').update({
        name: staffForm.name,
        email: staffForm.email.toLowerCase(),
        phone: staffForm.phone,
        role: staffForm.role,
        department: staffForm.department,
        is_active: staffForm.status === 'Active'
      }).eq('user_id', selectedStaff.user_id);
      setShowEditStaff(false);
      setSelectedStaff(null);
      setStaffForm({ name: '', email: '', phone: '', role: '', department: '', status: 'Active' });
      loadStaff();
    } catch (error) {
      console.error('Error editing staff:', error);
    }
  };

  const handleToggleStatus = async (staffMember) => {
    try {
      await supabase.from('users').update({
        is_active: !staffMember.is_active
      }).eq('user_id', staffMember.user_id);
      loadStaff();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleResetPassword = async (staffMember) => {
    try {
      // TODO: Implement password reset functionality
      console.log('Reset password for:', staffMember);
      alert('Password reset functionality to be implemented');
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const handleViewProfile = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowViewProfile(true);
  };

  const handleEditProfile = (staffMember) => {
    setSelectedStaff(staffMember);
    setStaffForm({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      role: staffMember.role,
      department: staffMember.department || '',
      status: staffMember.is_active ? 'Active' : 'Inactive'
    });
    setShowEditStaff(true);
  };

  const filteredStaff = staff.filter(member => 
    (searchTerm ? member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   member.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   member.role?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? member.department === departmentFilter : true) &&
    (statusFilter ? (member.is_active ? 'Active' : 'Inactive') === statusFilter : true) &&
    (roleFilter ? member.role === roleFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Staff Profiles & Roles
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => console.log('Import Staff')}
          >
            Import Staff
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddStaff(true)}
          >
            Add Staff Member
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by Name, Email, or Role"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="hr_manager">HR Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Staff Members</Typography>
          <DataTable
            data={filteredStaff}
            loading={loading}
            columns={[
              { 
                field: 'name', 
                headerName: 'Name',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                      {params.value?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'role', 
                headerName: 'Role',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color={params.value === 'admin' ? 'error' : params.value === 'driver' ? 'primary' : 'default'}
                  />
                )
              },
              { 
                field: 'department', 
                headerName: 'Department',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value || 'N/A'}
                  </Typography>
                )
              },
              { 
                field: 'is_active', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value ? 'Active' : 'Inactive'} 
                    size="small" 
                    color={params.value ? 'success' : 'error'}
                  />
                )
              },
              { 
                field: 'email', 
                headerName: 'Email',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'phone', 
                headerName: 'Phone',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value || 'N/A'}
                  </Typography>
                )
              }
            ]}
            rowActions={[
              { label: 'View Profile', icon: <VisibilityIcon />, onClick: ({ row }) => handleViewProfile(row) },
              { label: 'Edit Profile', icon: <EditIcon />, onClick: ({ row }) => handleEditProfile(row) },
              { label: 'Activate/Deactivate', icon: <PauseIcon />, onClick: ({ row }) => handleToggleStatus(row) },
              { label: 'Reset Password', icon: <LockResetIcon />, onClick: ({ row }) => handleResetPassword(row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Dialog open={showAddStaff} onClose={() => setShowAddStaff(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Staff Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={staffForm.name}
                onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={staffForm.role}
                  label="Role"
                  onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="hr_manager">HR Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={staffForm.department}
                  label="Department"
                  onChange={(e) => setStaffForm({...staffForm, department: e.target.value})}
                >
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={staffForm.status}
                  label="Status"
                  onChange={(e) => setStaffForm({...staffForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddStaff(false)}>Cancel</Button>
          <Button onClick={handleAddStaff} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Staff Modal */}
      <Dialog open={showEditStaff} onClose={() => setShowEditStaff(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={staffForm.name}
                onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={staffForm.role}
                  label="Role"
                  onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="hr_manager">HR Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                  <MenuItem value="maintenance_manager">Maintenance Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={staffForm.department}
                  label="Department"
                  onChange={(e) => setStaffForm({...staffForm, department: e.target.value})}
                >
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={staffForm.status}
                  label="Status"
                  onChange={(e) => setStaffForm({...staffForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditStaff(false)}>Cancel</Button>
          <Button onClick={handleEditStaff} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Profile Modal */}
      <Dialog open={showViewProfile} onClose={() => setShowViewProfile(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Staff Profile</DialogTitle>
        <DialogContent>
          {selectedStaff && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar sx={{ width: 80, height: 80, fontSize: '2rem', mx: 'auto', mb: 2 }}>
                  {selectedStaff.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {selectedStaff.name}
                </Typography>
                <Chip 
                  label={selectedStaff.role} 
                  color={selectedStaff.role === 'admin' ? 'error' : selectedStaff.role === 'driver' ? 'primary' : 'default'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedStaff.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{selectedStaff.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Department</Typography>
                <Typography variant="body1">{selectedStaff.department || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedStaff.is_active ? 'Active' : 'Inactive'} 
                  color={selectedStaff.is_active ? 'success' : 'error'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Member Since</Typography>
                <Typography variant="body1">
                  {new Date(selectedStaff.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewProfile(false)}>Close</Button>
          <Button 
            onClick={() => {
              setShowViewProfile(false);
              handleEditProfile(selectedStaff);
            }} 
            variant="contained"
          >
            Edit Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
