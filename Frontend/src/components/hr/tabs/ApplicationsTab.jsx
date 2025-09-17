import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, Email as EmailIcon, Person as PersonIcon, Work as WorkIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function ApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  
  // Modal states
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [showViewApplication, setShowViewApplication] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  
  // Form states
  const [applicationForm, setApplicationForm] = useState({
    applicantName: '',
    email: '',
    phone: '',
    jobPosting: '',
    resume: '',
    coverLetter: '',
    status: 'Applied'
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: applicationsData }, { data: jobPostingsData }] = await Promise.all([
        supabase
          .from('applications')
          .select(`
            id, applicant_name, email, phone, job_posting_id, resume_url, cover_letter, status, date_applied, created_at,
            job_postings!inner(job_title, department)
          `)
          .eq('company_id', companyId)
          .order('date_applied', { ascending: false }),
        supabase
          .from('job_postings')
          .select('id, job_title, department')
          .eq('company_id', companyId)
          .eq('status', 'active')
      ]);
      
      // Transform applications data to include job posting details
      const transformedApplications = (applicationsData || []).map(record => ({
        ...record,
        jobTitle: record.job_postings?.job_title || 'Unknown',
        department: record.job_postings?.department || 'N/A'
      }));
      
      setApplications(transformedApplications);
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

  const handleAddApplication = async () => {
    try {
      if (!applicationForm.applicantName || !applicationForm.email || !applicationForm.jobPosting) return;
      await supabase.from('applications').insert([{
        company_id: companyId,
        applicant_name: applicationForm.applicantName,
        email: applicationForm.email,
        phone: applicationForm.phone,
        job_posting_id: applicationForm.jobPosting,
        resume_url: applicationForm.resume,
        cover_letter: applicationForm.coverLetter,
        status: applicationForm.status.toLowerCase(),
        date_applied: new Date().toISOString()
      }]);
      setShowAddApplication(false);
      setApplicationForm({
        applicantName: '',
        email: '',
        phone: '',
        jobPosting: '',
        resume: '',
        coverLetter: '',
        status: 'Applied'
      });
      loadData();
    } catch (error) {
      console.error('Error adding application:', error);
    }
  };

  const handleUpdateStatus = async (application, newStatus) => {
    try {
      await supabase.from('applications').update({
        status: newStatus
      }).eq('id', application.id);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendEmail = async (application) => {
    try {
      // TODO: Implement email functionality
      console.log('Sending email to:', application.email);
      alert('Email functionality to be implemented');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowViewApplication(true);
  };

  const filteredApplications = applications.filter(application => 
    (searchTerm ? application.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   application.email?.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
    (jobTitleFilter ? application.jobTitle === jobTitleFilter : true) &&
    (statusFilter ? application.status === statusFilter : true) &&
    (departmentFilter ? application.department === departmentFilter : true)
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddApplication(true)}
        >
          Add Application Manually
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search by Applicant Name or Email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Job Title</InputLabel>
                <Select
                  value={jobTitleFilter}
                  label="Job Title"
                  onChange={(e) => setJobTitleFilter(e.target.value)}
                >
                  <MenuItem value="">All Jobs</MenuItem>
                  {jobPostings.map(job => (
                    <MenuItem key={job.id} value={job.job_title}>
                      {job.job_title}
                    </MenuItem>
                  ))}
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
                  <MenuItem value="applied">Applied</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="interviewed">Interviewed</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
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
          </Grid>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Job Applications</Typography>
          <DataTable
            data={filteredApplications}
            loading={loading}
            columns={[
              { 
                field: 'applicant_name', 
                headerName: 'Applicant',
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
                field: 'email', 
                headerName: 'Email',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'jobTitle', 
                headerName: 'Job Title',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon fontSize="small" color="action" />
                    <Typography variant="body2">
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
                field: 'date_applied', 
                headerName: 'Date Applied',
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
                    color={params.value === 'accepted' ? 'success' : params.value === 'rejected' ? 'error' : params.value === 'interviewed' ? 'info' : 'warning'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Update Status', icon: <EditIcon />, onClick: ({ row }) => console.log('Update Status', row) },
              { label: 'View Application/Resume', icon: <VisibilityIcon />, onClick: ({ row }) => handleViewApplication(row) },
              { label: 'Send Email to Applicant', icon: <EmailIcon />, onClick: ({ row }) => handleSendEmail(row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Add Application Modal */}
      <Dialog open={showAddApplication} onClose={() => setShowAddApplication(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Application Manually</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Applicant Name"
                value={applicationForm.applicantName}
                onChange={(e) => setApplicationForm({...applicationForm, applicantName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={applicationForm.email}
                onChange={(e) => setApplicationForm({...applicationForm, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={applicationForm.phone}
                onChange={(e) => setApplicationForm({...applicationForm, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Job Posting</InputLabel>
                <Select
                  value={applicationForm.jobPosting}
                  label="Job Posting"
                  onChange={(e) => setApplicationForm({...applicationForm, jobPosting: e.target.value})}
                >
                  {jobPostings.map(job => (
                    <MenuItem key={job.id} value={job.id}>
                      {job.job_title} - {job.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Resume URL"
                value={applicationForm.resume}
                onChange={(e) => setApplicationForm({...applicationForm, resume: e.target.value})}
                placeholder="https://..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cover Letter"
                multiline
                rows={4}
                value={applicationForm.coverLetter}
                onChange={(e) => setApplicationForm({...applicationForm, coverLetter: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={applicationForm.status}
                  label="Status"
                  onChange={(e) => setApplicationForm({...applicationForm, status: e.target.value})}
                >
                  <MenuItem value="Applied">Applied</MenuItem>
                  <MenuItem value="Reviewed">Reviewed</MenuItem>
                  <MenuItem value="Interviewed">Interviewed</MenuItem>
                  <MenuItem value="Accepted">Accepted</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddApplication(false)}>Cancel</Button>
          <Button onClick={handleAddApplication} variant="contained">Add Application</Button>
        </DialogActions>
      </Dialog>

      {/* View Application Modal */}
      <Dialog open={showViewApplication} onClose={() => setShowViewApplication(false)} maxWidth="md" fullWidth>
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar sx={{ width: 80, height: 80, fontSize: '2rem', mx: 'auto', mb: 2 }}>
                  {selectedApplication.applicant_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {selectedApplication.applicant_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedApplication.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{selectedApplication.phone || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedApplication.status} 
                  color={selectedApplication.status === 'accepted' ? 'success' : selectedApplication.status === 'rejected' ? 'error' : selectedApplication.status === 'interviewed' ? 'info' : 'warning'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Job Title</Typography>
                <Typography variant="body1">{selectedApplication.jobTitle}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Department</Typography>
                <Typography variant="body1">{selectedApplication.department}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Date Applied</Typography>
                <Typography variant="body1">{new Date(selectedApplication.date_applied).toLocaleDateString()}</Typography>
              </Grid>
              {selectedApplication.resume_url && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Resume</Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => window.open(selectedApplication.resume_url, '_blank')}
                  >
                    View Resume
                  </Button>
                </Grid>
              )}
              {selectedApplication.cover_letter && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Cover Letter</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedApplication.cover_letter}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewApplication(false)}>Close</Button>
          {selectedApplication && (
            <>
              <Button 
                onClick={() => {
                  handleUpdateStatus(selectedApplication, 'rejected');
                  setShowViewApplication(false);
                }} 
                color="error"
              >
                Reject
              </Button>
              <Button 
                onClick={() => {
                  handleUpdateStatus(selectedApplication, 'accepted');
                  setShowViewApplication(false);
                }} 
                variant="contained"
                color="success"
              >
                Accept
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
