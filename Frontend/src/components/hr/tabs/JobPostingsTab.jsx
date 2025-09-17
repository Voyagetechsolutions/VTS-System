import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, Close as CloseIcon, Work as WorkIcon, LocationOn as LocationOnIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function JobPostingsTab() {
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddJobPosting, setShowAddJobPosting] = useState(false);
  const [showEditJobPosting, setShowEditJobPosting] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedJobPosting, setSelectedJobPosting] = useState(null);
  
  // Form states
  const [jobPostingForm, setJobPostingForm] = useState({
    jobTitle: '',
    department: '',
    location: '',
    description: '',
    requirements: '',
    salaryRange: '',
    employmentType: 'Full-time',
    status: 'Active'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: jobPostingsData } = await supabase
        .from('job_postings')
        .select(`
          id, job_title, department, location, description, requirements, salary_range, employment_type, status, date_posted, created_at
        `)
        .eq('company_id', companyId)
        .order('date_posted', { ascending: false });
      
      setJobPostings(jobPostingsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleAddJobPosting = async () => {
    try {
      if (!jobPostingForm.jobTitle || !jobPostingForm.department || !jobPostingForm.description) return;
      await supabase.from('job_postings').insert([{
        company_id: companyId,
        job_title: jobPostingForm.jobTitle,
        department: jobPostingForm.department,
        location: jobPostingForm.location,
        description: jobPostingForm.description,
        requirements: jobPostingForm.requirements,
        salary_range: jobPostingForm.salaryRange,
        employment_type: jobPostingForm.employmentType,
        status: jobPostingForm.status.toLowerCase(),
        date_posted: new Date().toISOString()
      }]);
      setShowAddJobPosting(false);
      setJobPostingForm({
        jobTitle: '',
        department: '',
        location: '',
        description: '',
        requirements: '',
        salaryRange: '',
        employmentType: 'Full-time',
        status: 'Active'
      });
      loadData();
    } catch (error) {
      console.error('Error adding job posting:', error);
    }
  };

  const handleCloseJobPosting = async (jobPosting) => {
    try {
      await supabase.from('job_postings').update({
        status: 'closed'
      }).eq('id', jobPosting.id);
      loadData();
    } catch (error) {
      console.error('Error closing job posting:', error);
    }
  };

  const handleViewDetails = (jobPosting) => {
    setSelectedJobPosting(jobPosting);
    setShowViewDetails(true);
  };

  const handleEditJobPosting = (jobPosting) => {
    setSelectedJobPosting(jobPosting);
    setJobPostingForm({
      jobTitle: jobPosting.job_title || '',
      department: jobPosting.department || '',
      location: jobPosting.location || '',
      description: jobPosting.description || '',
      requirements: jobPosting.requirements || '',
      salaryRange: jobPosting.salary_range || '',
      employmentType: jobPosting.employment_type || 'Full-time',
      status: jobPosting.status.charAt(0).toUpperCase() + jobPosting.status.slice(1)
    });
    setShowEditJobPosting(true);
  };

  const filteredJobPostings = jobPostings.filter(posting => 
    (searchTerm ? posting.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   posting.department?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (departmentFilter ? posting.department === departmentFilter : true) &&
    (statusFilter ? posting.status === statusFilter : true) &&
    (employmentTypeFilter ? posting.employment_type === employmentTypeFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Job Postings
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddJobPosting(true)}
        >
          Add Job Posting
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search by Job Title or Department"
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={employmentTypeFilter}
                  label="Employment Type"
                  onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Full-time">Full-time</MenuItem>
                  <MenuItem value="Part-time">Part-time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Temporary">Temporary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Job Postings Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Active Job Postings</Typography>
          <DataTable
            data={filteredJobPostings}
            loading={loading}
            columns={[
              { 
                field: 'job_title', 
                headerName: 'Job Title',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon fontSize="small" color="action" />
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
                field: 'location', 
                headerName: 'Location',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'employment_type', 
                headerName: 'Type',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color={params.value === 'Full-time' ? 'primary' : params.value === 'Part-time' ? 'secondary' : 'default'}
                  />
                )
              },
              { 
                field: 'salary_range', 
                headerName: 'Salary Range',
                renderCell: (params) => (
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    {params.value || 'Not specified'}
                  </Typography>
                )
              },
              { 
                field: 'date_posted', 
                headerName: 'Date Posted',
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
                    color={params.value === 'active' ? 'success' : params.value === 'closed' ? 'error' : 'warning'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Edit Posting', icon: <EditIcon />, onClick: ({ row }) => handleEditJobPosting(row) },
              { label: 'Close Posting', icon: <CloseIcon />, onClick: ({ row }) => handleCloseJobPosting(row) },
              { label: 'View Details', icon: <VisibilityIcon />, onClick: ({ row }) => handleViewDetails(row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Job Posting Modal */}
      <Dialog open={showAddJobPosting} onClose={() => setShowAddJobPosting(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Job Posting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={jobPostingForm.jobTitle}
                onChange={(e) => setJobPostingForm({...jobPostingForm, jobTitle: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={jobPostingForm.department}
                  label="Department"
                  onChange={(e) => setJobPostingForm({...jobPostingForm, department: e.target.value})}
                >
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={jobPostingForm.location}
                onChange={(e) => setJobPostingForm({...jobPostingForm, location: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={jobPostingForm.employmentType}
                  label="Employment Type"
                  onChange={(e) => setJobPostingForm({...jobPostingForm, employmentType: e.target.value})}
                >
                  <MenuItem value="Full-time">Full-time</MenuItem>
                  <MenuItem value="Part-time">Part-time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Temporary">Temporary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Salary Range"
                value={jobPostingForm.salaryRange}
                onChange={(e) => setJobPostingForm({...jobPostingForm, salaryRange: e.target.value})}
                placeholder="e.g., $50,000 - $70,000"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Description"
                multiline
                rows={4}
                value={jobPostingForm.description}
                onChange={(e) => setJobPostingForm({...jobPostingForm, description: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements"
                multiline
                rows={3}
                value={jobPostingForm.requirements}
                onChange={(e) => setJobPostingForm({...jobPostingForm, requirements: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={jobPostingForm.status}
                  label="Status"
                  onChange={(e) => setJobPostingForm({...jobPostingForm, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Paused">Paused</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddJobPosting(false)}>Cancel</Button>
          <Button onClick={handleAddJobPosting} variant="contained">Post Job</Button>
        </DialogActions>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={showViewDetails} onClose={() => setShowViewDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Job Posting Details</DialogTitle>
        <DialogContent>
          {selectedJobPosting && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom>
                  {selectedJobPosting.job_title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip label={selectedJobPosting.department} color="primary" />
                  <Chip label={selectedJobPosting.employment_type} color="secondary" />
                  <Chip 
                    label={selectedJobPosting.status} 
                    color={selectedJobPosting.status === 'active' ? 'success' : selectedJobPosting.status === 'closed' ? 'error' : 'warning'}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{selectedJobPosting.location}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Salary Range</Typography>
                <Typography variant="body1">{selectedJobPosting.salary_range || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Date Posted</Typography>
                <Typography variant="body1">{new Date(selectedJobPosting.date_posted).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Job Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedJobPosting.description}
                </Typography>
              </Grid>
              {selectedJobPosting.requirements && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Requirements</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedJobPosting.requirements}
                  </Typography>
                </Grid>
              )}
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
