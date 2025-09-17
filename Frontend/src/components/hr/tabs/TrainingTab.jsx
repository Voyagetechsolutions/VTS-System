import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, Notifications as NotificationsIcon, School as SchoolIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function TrainingTab() {
  const [certifications, setCertifications] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [showEditTraining, setShowEditTraining] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState(null);
  
  // Form states
  const [trainingForm, setTrainingForm] = useState({
    employee: '',
    certificationType: '',
    issuedDate: '',
    expiryDate: '',
    status: 'Assigned'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [certificationFilter, setCertificationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: certificationsData }, { data: staffData }] = await Promise.all([
        supabase
          .from('certifications')
          .select(`
            id, staff_id, type, issued_at, expires_at, status, created_at,
            users!inner(name, department, role)
          `)
          .eq('company_id', companyId)
          .order('expires_at', { ascending: true }),
        supabase
          .from('users')
          .select('user_id, name, department, role, is_active')
          .eq('company_id', companyId)
          .eq('is_active', true)
      ]);
      
      // Transform certifications data to include employee names
      const transformedCertifications = (certificationsData || []).map(record => ({
        ...record,
        employee: record.users?.name || 'Unknown',
        department: record.users?.department || 'N/A',
        role: record.users?.role || 'N/A'
      }));
      
      setCertifications(transformedCertifications);
      setStaff(staffData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);
  const handleAddTraining = async () => {
    try {
      if (!trainingForm.employee || !trainingForm.certificationType) return;
      await supabase.from('certifications').insert([{
        company_id: companyId,
        staff_id: trainingForm.employee,
        type: trainingForm.certificationType,
        issued_at: trainingForm.issuedDate ? new Date(trainingForm.issuedDate).toISOString() : new Date().toISOString(),
        expires_at: trainingForm.expiryDate ? new Date(trainingForm.expiryDate).toISOString() : null,
        status: trainingForm.status.toLowerCase()
      }]);
      setShowAddTraining(false);
      setTrainingForm({
        employee: '',
        certificationType: '',
        issuedDate: '',
        expiryDate: '',
        status: 'Assigned'
      });
      loadData();
    } catch (error) {
      console.error('Error adding training:', error);
    }
  };

  const handleNotifyEmployee = async (certificationRecord) => {
    try {
      // TODO: Implement notification functionality
      console.log('Notifying employee:', certificationRecord);
      alert('Notification functionality to be implemented');
    } catch (error) {
      console.error('Error notifying employee:', error);
    }
  };

  const handleViewDetails = (certificationRecord) => {
    setSelectedCertification(certificationRecord);
    setShowViewDetails(true);
  };

  const filteredCertifications = certifications.filter(record => 
    (searchTerm ? record.employee?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   record.department?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? record.department === departmentFilter : true) &&
    (certificationFilter ? record.type === certificationFilter : true) &&
    (statusFilter ? record.status === statusFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Training & Certification Tracking
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddTraining(true)}
        >
          Add Training/Certification
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search by Employee Name or Department"
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
                <InputLabel>Certification</InputLabel>
                <Select
                  value={certificationFilter}
                  label="Certification"
                  onChange={(e) => setCertificationFilter(e.target.value)}
                >
                  <MenuItem value="">All Certifications</MenuItem>
                  <MenuItem value="Safety Training">Safety Training</MenuItem>
                  <MenuItem value="Driver License">Driver License</MenuItem>
                  <MenuItem value="First Aid">First Aid</MenuItem>
                  <MenuItem value="Customer Service">Customer Service</MenuItem>
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
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Certifications Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Training & Certifications</Typography>
          <DataTable
            data={filteredCertifications}
            loading={loading}
            columns={[
              { 
                field: 'employee', 
                headerName: 'Employee',
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
                field: 'department', 
                headerName: 'Department',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'type', 
                headerName: 'Training/Certification',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'issued_at', 
                headerName: 'Issued Date',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
                  </Typography>
                )
              },
              { 
                field: 'expires_at', 
                headerName: 'Expiry Date',
                renderCell: (params) => {
                  const isExpired = params.value && new Date(params.value) < new Date();
                  const isExpiringSoon = params.value && new Date(params.value) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  return (
                    <Typography 
                      variant="body2" 
                      color={isExpired ? 'error' : isExpiringSoon ? 'warning.main' : 'text.secondary'}
                    >
                      {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
                    </Typography>
                  );
                }
              },
              { 
                field: 'status', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color={params.value === 'completed' ? 'success' : params.value === 'assigned' ? 'warning' : 'error'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'View Details', icon: <VisibilityIcon />, onClick: ({ row }) => handleViewDetails(row) },
              { label: 'Notify Employee', icon: <NotificationsIcon />, onClick: ({ row }) => handleNotifyEmployee(row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Training/Certification Modal */}
      <Dialog open={showAddTraining} onClose={() => setShowAddTraining(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Training/Certification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={trainingForm.employee}
                  label="Employee"
                  onChange={(e) => setTrainingForm({...trainingForm, employee: e.target.value})}
                >
                  {staff.map(emp => (
                    <MenuItem key={emp.user_id} value={emp.user_id}>
                      {emp.name} ({emp.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Certification Type</InputLabel>
                <Select
                  value={trainingForm.certificationType}
                  label="Certification Type"
                  onChange={(e) => setTrainingForm({...trainingForm, certificationType: e.target.value})}
                >
                  <MenuItem value="Safety Training">Safety Training</MenuItem>
                  <MenuItem value="Driver License">Driver License</MenuItem>
                  <MenuItem value="First Aid">First Aid</MenuItem>
                  <MenuItem value="Customer Service">Customer Service</MenuItem>
                  <MenuItem value="Technical Training">Technical Training</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Issued Date"
                type="date"
                value={trainingForm.issuedDate}
                onChange={(e) => setTrainingForm({...trainingForm, issuedDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={trainingForm.expiryDate}
                onChange={(e) => setTrainingForm({...trainingForm, expiryDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={trainingForm.status}
                  label="Status"
                  onChange={(e) => setTrainingForm({...trainingForm, status: e.target.value})}
                >
                  <MenuItem value="Assigned">Assigned</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddTraining(false)}>Cancel</Button>
          <Button onClick={handleAddTraining} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={showViewDetails} onClose={() => setShowViewDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Certification Details</DialogTitle>
        <DialogContent>
          {selectedCertification && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar sx={{ width: 80, height: 80, fontSize: '2rem', mx: 'auto', mb: 2 }}>
                  {selectedCertification.employee?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {selectedCertification.employee}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCertification.department}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Certification Type</Typography>
                <Typography variant="body1">{selectedCertification.type}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedCertification.status} 
                  color={selectedCertification.status === 'completed' ? 'success' : selectedCertification.status === 'assigned' ? 'warning' : 'error'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Issued Date</Typography>
                <Typography variant="body1">
                  {selectedCertification.issued_at ? new Date(selectedCertification.issued_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                <Typography variant="body1">
                  {selectedCertification.expires_at ? new Date(selectedCertification.expires_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Assigned On</Typography>
                <Typography variant="body1">{new Date(selectedCertification.created_at).toLocaleDateString()}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
