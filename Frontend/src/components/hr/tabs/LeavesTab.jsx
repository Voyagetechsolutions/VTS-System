import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, Event as EventIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function LeavesTab() {
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  
  // Form states
  const [leaveForm, setLeaveForm] = useState({
    employee: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    start: '',
    end: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: leavesData }, { data: staffData }] = await Promise.all([
        supabase
          .from('leaves')
          .select(`
            id, staff_id, type, start_date, end_date, reason, status, created_at,
            users!inner(name, department, role)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('user_id, name, department, role, is_active')
          .eq('company_id', companyId)
          .eq('is_active', true)
      ]);
      
      // Transform leaves data to include employee names
      const transformedLeaves = (leavesData || []).map(record => ({
        ...record,
        employee: record.users?.name || 'Unknown',
        department: record.users?.department || 'N/A',
        role: record.users?.role || 'N/A'
      }));
      
      setLeaves(transformedLeaves);
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
  const handleAddLeave = async () => {
    try {
      if (!leaveForm.employee || !leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate) return;
      await supabase.from('leaves').insert([{
        company_id: companyId,
        staff_id: leaveForm.employee,
        type: leaveForm.leaveType,
        start_date: leaveForm.startDate,
        end_date: leaveForm.endDate,
        reason: leaveForm.reason,
        status: leaveForm.status.toLowerCase()
      }]);
      setShowAddLeave(false);
      setLeaveForm({
        employee: '',
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        status: 'Pending'
      });
      loadData();
    } catch (error) {
      console.error('Error adding leave:', error);
    }
  };

  const handleApproveLeave = async (leaveRecord) => {
    try {
      await supabase.from('leaves').update({
        status: 'approved'
      }).eq('id', leaveRecord.id);
      loadData();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleRejectLeave = async (leaveRecord) => {
    try {
      await supabase.from('leaves').update({
        status: 'rejected'
      }).eq('id', leaveRecord.id);
      loadData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
    }
  };

  const filteredLeaves = leaves.filter(record => 
    (searchTerm ? record.employee?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   record.department?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? record.department === departmentFilter : true) &&
    (leaveTypeFilter ? record.type === leaveTypeFilter : true) &&
    (statusFilter ? record.status === statusFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Leaves & Absences
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddLeave(true)}
        >
          Add Leave Request
        </Button>
      </Box>

      {/* Leaves Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Leave Requests</Typography>
          <DataTable
            data={filteredLeaves}
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
                headerName: 'Leave Type',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color={params.value === 'vacation' ? 'primary' : params.value === 'sick' ? 'warning' : 'default'}
                  />
                )
              },
              { 
                field: 'start_date', 
                headerName: 'Start Date',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                  </Typography>
                )
              },
              { 
                field: 'end_date', 
                headerName: 'End Date',
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
                    color={params.value === 'approved' ? 'success' : params.value === 'pending' ? 'warning' : 'error'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Approve/Reject', icon: <CheckCircleIcon />, onClick: ({ row }) => handleApproveLeave(row) },
              { label: 'View Details', icon: <VisibilityIcon />, onClick: ({ row }) => console.log('View', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Leave Request Modal */}
      <Dialog open={showAddLeave} onClose={() => setShowAddLeave(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Leave Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={leaveForm.employee}
                  label="Employee"
                  onChange={(e) => setLeaveForm({...leaveForm, employee: e.target.value})}
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
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={leaveForm.leaveType}
                  label="Leave Type"
                  onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                >
                  <MenuItem value="vacation">Vacation</MenuItem>
                  <MenuItem value="sick">Sick</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason / Notes"
                multiline
                rows={3}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={leaveForm.status}
                  label="Status"
                  onChange={(e) => setLeaveForm({...leaveForm, status: e.target.value})}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddLeave(false)}>Cancel</Button>
          <Button onClick={handleAddLeave} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


