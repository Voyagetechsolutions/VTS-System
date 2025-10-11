import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, RadioGroup, Radio, Alert, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Send as SendIcon, Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon, Announcement as AnnouncementIcon, Business as BusinessIcon, People as PeopleIcon, Email as EmailIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getCompaniesLight, getAnnouncements, createAnnouncement, sendAnnouncement, deleteAnnouncement } from '../../../supabase/api';

export default function AnnouncementsDevTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  
  // Modal states
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showAnnouncementDetails, setShowAnnouncementDetails] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  
  // Create announcement form state
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    specificCompany: '',
    specificRole: '',
    deliveryMethod: 'both',
    priority: 'normal'
  });

  const load = async () => {
    setLoading(true);
    try {
      const [companiesRes, announcementsRes] = await Promise.all([
        getCompaniesLight(),
        getAnnouncements()
      ]);
      
      setCompanies(companiesRes.data || []);
      setAnnouncements(announcementsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredAnnouncements = announcements.filter(announcement => (
    (statusFilter ? announcement.status === statusFilter : true) &&
    (audienceFilter ? announcement.targetAudience === audienceFilter : true) &&
    (searchTitle ? announcement.title.toLowerCase().includes(searchTitle.toLowerCase()) : true)
  ));

  const handleCreateAnnouncement = async () => {
    try {
      await createAnnouncement({
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        target_audience: newAnnouncement.targetAudience,
        delivery_method: newAnnouncement.deliveryMethod,
        priority: newAnnouncement.priority
      });
      setShowCreateAnnouncement(false);
      setNewAnnouncement({
        title: '',
        message: '',
        targetAudience: 'all',
        specificCompany: '',
        specificRole: '',
        deliveryMethod: 'both',
        priority: 'normal'
      });
      load();
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementDetails(true);
  };

  const handleSendAnnouncement = async (announcementId) => {
    try {
      await sendAnnouncement(announcementId);
      load();
    } catch (error) {
      console.error('Error sending announcement:', error);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      await deleteAnnouncement(announcementId);
      load();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'draft': return 'warning';
      case 'scheduled': return 'info';
      default: return 'default';
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case 'all': return 'All Users';
      case 'company_admins': return 'Company Admins';
      case 'specific_company': return 'Specific Company';
      case 'specific_role': return 'Specific Role';
      default: return audience;
    }
  };

  const actions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewAnnouncement(row),
      color: 'primary'
    },
    { 
      label: 'Edit', 
      icon: <EditIcon />, 
      onClick: async ({ row }) => { 
        // TODO: Implement edit functionality
        console.log('Edit announcement:', row);
      },
      color: 'info'
    },
    { 
      label: row => row.status === 'draft' ? 'Send' : 'Resend', 
      icon: <SendIcon />, 
      onClick: async ({ row }) => { 
        await handleSendAnnouncement(row.id);
      },
      color: 'success'
    },
    { 
      label: 'Delete', 
      icon: <DeleteIcon />, 
      onClick: async ({ row }) => { 
        await handleDeleteAnnouncement(row.id);
      },
      color: 'error'
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Announcements
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateAnnouncement(true)}
        >
          Send Announcement
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search by Title"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={audienceFilter}
                  label="Target Audience"
                  onChange={(e) => setAudienceFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="company_admins">Company Admins</MenuItem>
                  <MenuItem value="specific_company">Specific Company</MenuItem>
                  <MenuItem value="specific_role">Specific Role</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Announcements Table */}
      <Card>
        <CardContent>
          <DataTable
            data={filteredAnnouncements}
            loading={loading}
            columns={[
              { 
                field: 'title', 
                headerName: 'Title', 
                sortable: true,
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnnouncementIcon color="primary" />
                    <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'targetAudience', 
                headerName: 'Target Audience',
                renderCell: (params) => (
                  <Chip 
                    label={getAudienceLabel(params.value)} 
                    color="secondary"
                    size="small"
                    icon={<PeopleIcon />}
                  />
                )
              },
              { 
                field: 'deliveryMethod', 
                headerName: 'Delivery Method',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {params.value === 'email' && <EmailIcon fontSize="small" color="action" />}
                    {params.value === 'dashboard' && <NotificationsIcon fontSize="small" color="action" />}
                    {params.value === 'both' && (
                      <>
                        <EmailIcon fontSize="small" color="action" />
                        <NotificationsIcon fontSize="small" color="action" />
                      </>
                    )}
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'priority', 
                headerName: 'Priority',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    color={getPriorityColor(params.value)}
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
              { field: 'sentAt', headerName: 'Sent At', type: 'date', sortable: true },
            ]}
            rowActions={actions}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Create Announcement Modal */}
      <Dialog open={showCreateAnnouncement} onClose={() => setShowCreateAnnouncement(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Platform Announcement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={newAnnouncement.targetAudience}
                  label="Target Audience"
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, targetAudience: e.target.value})}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="company_admins">Company Admins Only</MenuItem>
                  <MenuItem value="specific_company">Specific Company</MenuItem>
                  <MenuItem value="specific_role">Specific Role</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {newAnnouncement.targetAudience === 'specific_company' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Company</InputLabel>
                  <Select
                    value={newAnnouncement.specificCompany}
                    label="Select Company"
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, specificCompany: e.target.value})}
                  >
                    {companies.map(company => (
                      <MenuItem key={company.company_id} value={company.company_id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {newAnnouncement.targetAudience === 'specific_role' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Role</InputLabel>
                  <Select
                    value={newAnnouncement.specificRole}
                    label="Select Role"
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, specificRole: e.target.value})}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="ops_manager">Operations Manager</MenuItem>
                    <MenuItem value="booking_officer">Booking Officer</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="developer">Developer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Delivery Method</Typography>
              <RadioGroup
                value={newAnnouncement.deliveryMethod}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, deliveryMethod: e.target.value})}
                row
              >
                <FormControlLabel value="dashboard" control={<Radio />} label="Dashboard Notification" />
                <FormControlLabel value="email" control={<Radio />} label="Email" />
                <FormControlLabel value="both" control={<Radio />} label="Both" />
              </RadioGroup>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newAnnouncement.priority}
                  label="Priority"
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateAnnouncement(false)}>Cancel</Button>
          <Button variant="outlined">Save as Draft</Button>
          <Button onClick={handleCreateAnnouncement} variant="contained">Send Announcement</Button>
        </DialogActions>
      </Dialog>

      {/* Announcement Details Modal */}
      <Dialog open={showAnnouncementDetails} onClose={() => setShowAnnouncementDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnnouncementIcon />
            {selectedAnnouncement?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAnnouncement && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Message</Typography>
                <Typography variant="body1" sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  {selectedAnnouncement.message}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Target Audience</Typography>
                <Chip 
                  label={getAudienceLabel(selectedAnnouncement.targetAudience)} 
                  color="secondary"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Delivery Method</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {selectedAnnouncement.deliveryMethod}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                <Chip 
                  label={selectedAnnouncement.priority} 
                  color={getPriorityColor(selectedAnnouncement.priority)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedAnnouncement.status} 
                  color={getStatusColor(selectedAnnouncement.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Sent By</Typography>
                <Typography variant="body1">{selectedAnnouncement.sentBy}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Sent At</Typography>
                <Typography variant="body1">
                  {selectedAnnouncement.sentAt ? new Date(selectedAnnouncement.sentAt).toLocaleString() : 'Not sent'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnnouncementDetails(false)}>Close</Button>
          <Button variant="contained">Edit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}