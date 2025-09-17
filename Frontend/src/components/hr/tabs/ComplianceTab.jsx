import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, Security as SecurityIcon, FileUpload as FileUploadIcon, Warning as WarningIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function ComplianceTab() {
  const [complianceRecords, setComplianceRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddCompliance, setShowAddCompliance] = useState(false);
  const [showEditCompliance, setShowEditCompliance] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState(null);
  
  // Form states
  const [complianceForm, setComplianceForm] = useState({
    documentName: '',
    department: '',
    type: '',
    description: '',
    status: 'Active'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: complianceData }, { data: staffData }] = await Promise.all([
        supabase
          .from('disciplinary_actions')
          .select(`
            id, staff_id, type, notes, action_date, status, created_at,
            users!inner(name, department, role)
          `)
          .eq('company_id', companyId)
          .order('action_date', { ascending: false }),
        supabase
          .from('users')
          .select('user_id, name, department, role, is_active')
          .eq('company_id', companyId)
          .eq('is_active', true)
      ]);
      
      // Transform compliance data to include employee names
      const transformedCompliance = (complianceData || []).map(record => ({
        ...record,
        employee: record.users?.name || 'Unknown',
        department: record.users?.department || 'N/A',
        role: record.users?.role || 'N/A'
      }));
      
      setComplianceRecords(transformedCompliance);
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
  const handleAddCompliance = async () => {
    try {
      if (!complianceForm.documentName || !complianceForm.department || !complianceForm.type) return;
      await supabase.from('disciplinary_actions').insert([{
        company_id: companyId,
        staff_id: null,
        type: complianceForm.type,
        notes: complianceForm.description,
        action_date: new Date().toISOString(),
        status: complianceForm.status.toLowerCase()
      }]);
      setShowAddCompliance(false);
      setComplianceForm({
        documentName: '',
        department: '',
        type: '',
        description: '',
        status: 'Active'
      });
      loadData();
    } catch (error) {
      console.error('Error adding compliance record:', error);
    }
  };

  const filteredCompliance = complianceRecords.filter(record => 
    (searchTerm ? record.employee?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   record.department?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? record.department === departmentFilter : true) &&
    (typeFilter ? record.type === typeFilter : true) &&
    (statusFilter ? record.status === statusFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Compliance & Safety
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => console.log('Import Compliance Records')}
          >
            Import Compliance Records
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddCompliance(true)}
          >
            Add Compliance Document/Safety Rule
          </Button>
        </Box>
      </Box>

      {/* Compliance Records Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Compliance & Safety Records</Typography>
          <DataTable
            data={filteredCompliance}
            loading={loading}
            columns={[
              { 
                field: 'type', 
                headerName: 'Document/Rule',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon fontSize="small" color="action" />
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
                field: 'action_date', 
                headerName: 'Date',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                  </Typography>
                )
              },
              { 
                field: 'status', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color={params.value === 'active' ? 'success' : params.value === 'resolved' ? 'info' : 'default'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'View Details', icon: <VisibilityIcon />, onClick: ({ row }) => console.log('View', row) },
              { label: 'Deactivate/Archive', icon: <WarningIcon />, onClick: ({ row }) => console.log('Archive', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Compliance Document Modal */}
      <Dialog open={showAddCompliance} onClose={() => setShowAddCompliance(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Compliance Document/Safety Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Document Name"
                value={complianceForm.documentName}
                onChange={(e) => setComplianceForm({...complianceForm, documentName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={complianceForm.department}
                  label="Department"
                  onChange={(e) => setComplianceForm({...complianceForm, department: e.target.value})}
                >
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="All">All Departments</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={complianceForm.type}
                  label="Type"
                  onChange={(e) => setComplianceForm({...complianceForm, type: e.target.value})}
                >
                  <MenuItem value="safety_policy">Safety Policy</MenuItem>
                  <MenuItem value="compliance_document">Compliance Document</MenuItem>
                  <MenuItem value="incident_report">Incident Report</MenuItem>
                  <MenuItem value="disciplinary_action">Disciplinary Action</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={complianceForm.description}
                onChange={(e) => setComplianceForm({...complianceForm, description: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={complianceForm.status}
                  label="Status"
                  onChange={(e) => setComplianceForm({...complianceForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCompliance(false)}>Cancel</Button>
          <Button onClick={handleAddCompliance} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


