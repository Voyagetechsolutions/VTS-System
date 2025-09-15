import React, { useEffect, useState } from 'react';
import { 
  Grid, Paper, Typography, Button, Box, Card, CardContent, 
  List, ListItem, ListItemText, ListItemIcon, Chip, Alert, 
  Stack, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel, Checkbox, FormGroup
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { 
  getAnnouncements, createAnnouncement, getNotificationPolicies,
  updateNotificationPolicy, sendGlobalMessage, getMessageTemplates
} from '../../../supabase/api';

// Company Admin Global Communications Dashboard
export default function GlobalCommunicationsTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [notificationPolicies, setNotificationPolicies] = useState([]);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [policyDialog, setPolicyDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'normal',
    target_roles: [],
    target_branches: [],
    channels: ['in_app'],
    scheduled_for: null,
    expires_at: null
  });

  const [policyForm, setPolicyForm] = useState({
    role: '',
    event_type: '',
    channels: [],
    enabled: true,
    template: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [announcementsRes, policiesRes, templatesRes] = await Promise.all([
        getAnnouncements(),
        getNotificationPolicies(),
        getMessageTemplates()
      ]);
      
      setAnnouncements(announcementsRes.data || []);
      setNotificationPolicies(policiesRes.data || []);
      setMessageTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Failed to load communications data:', error);
    }
  };

  const handleSendAnnouncement = async () => {
    try {
      await createAnnouncement(announcementForm);
      setAnnouncementDialog(false);
      setAnnouncementForm({
        title: '',
        message: '',
        priority: 'normal',
        target_roles: [],
        target_branches: [],
        channels: ['in_app'],
        scheduled_for: null,
        expires_at: null
      });
      loadData();
    } catch (error) {
      console.error('Failed to send announcement:', error);
    }
  };

  const handleUpdatePolicy = async () => {
    try {
      await updateNotificationPolicy(selectedPolicy.policy_id, policyForm);
      setPolicyDialog(false);
      setSelectedPolicy(null);
      loadData();
    } catch (error) {
      console.error('Failed to update policy:', error);
    }
  };

  const openPolicyDialog = (policy) => {
    setSelectedPolicy(policy);
    setPolicyForm({
      role: policy.role,
      event_type: policy.event_type,
      channels: policy.channels || [],
      enabled: policy.enabled,
      template: policy.template || ''
    });
    setPolicyDialog(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <WarningIcon />;
      case 'high': return <WarningIcon />;
      case 'normal': return <InfoIcon />;
      case 'low': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const roles = ['driver', 'booking_officer', 'ops_manager', 'depot_manager', 'maintenance_manager', 'finance_manager', 'hr_manager'];
  const channels = ['in_app', 'email', 'sms', 'push'];
  const eventTypes = ['booking_created', 'trip_delayed', 'maintenance_due', 'refund_processed', 'incident_reported', 'system_alert'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Global Communications & Notifications</Typography>
      
      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SendIcon />}
            onClick={() => setAnnouncementDialog(true)}
          >
            Send Announcement
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={<NotificationsIcon />}
            onClick={() => setPolicyDialog(true)}
          >
            Manage Notification Policies
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<EmailIcon />}
            onClick={() => {/* TODO: Open email template editor */}}
          >
            Email Templates
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Recent Announcements */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AnnouncementIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Announcements
              </Typography>
              {announcements.length === 0 ? (
                <Alert severity="info">No announcements sent yet</Alert>
              ) : (
                <List dense>
                  {announcements.slice(0, 10).map((announcement) => (
                    <ListItem key={announcement.announcement_id}>
                      <ListItemIcon>
                        {getPriorityIcon(announcement.priority)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">{announcement.title}</Typography>
                            <Chip 
                              label={announcement.priority} 
                              color={getPriorityColor(announcement.priority)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">{announcement.message}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Sent: {new Date(announcement.created_at).toLocaleString()} • 
                              To: {announcement.target_roles?.join(', ') || 'All roles'} • 
                              Channels: {announcement.channels?.join(', ')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Policies */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Notification Policies
              </Typography>
              {notificationPolicies.length === 0 ? (
                <Alert severity="info">No notification policies configured</Alert>
              ) : (
                <List dense>
                  {notificationPolicies.map((policy) => (
                    <ListItem key={policy.policy_id}>
                      <ListItemIcon>
                        <NotificationsIcon color={policy.enabled ? 'primary' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${policy.role} - ${policy.event_type}`}
                        secondary={`Channels: ${policy.channels?.join(', ')}`}
                      />
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => openPolicyDialog(policy)}
                      >
                        Edit
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Communication Channels Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Communication Channels Status</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon color="primary" />
                    <Typography>Email Service</Typography>
                    <Chip label="Active" color="success" size="small" />
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SmsIcon color="primary" />
                    <Typography>SMS Service</Typography>
                    <Chip label="Active" color="success" size="small" />
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <NotificationsIcon color="primary" />
                    <Typography>Push Notifications</Typography>
                    <Chip label="Active" color="success" size="small" />
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AnnouncementIcon color="primary" />
                    <Typography>In-App Messages</Typography>
                    <Chip label="Active" color="success" size="small" />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Send Announcement Dialog */}
      <Dialog open={announcementDialog} onClose={() => setAnnouncementDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Global Announcement</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm(f => ({ ...f, title: e.target.value }))}
            />
            
            <TextField
              label="Message"
              multiline
              rows={4}
              fullWidth
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm(f => ({ ...f, message: e.target.value }))}
            />
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm(f => ({ ...f, priority: e.target.value }))}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Target Roles</InputLabel>
              <Select
                multiple
                value={announcementForm.target_roles}
                onChange={(e) => setAnnouncementForm(f => ({ ...f, target_roles: e.target.value }))}
              >
                {roles.map(role => (
                  <MenuItem key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormGroup>
              <Typography variant="subtitle2">Channels</Typography>
              {channels.map(channel => (
                <FormControlLabel
                  key={channel}
                  control={
                    <Checkbox
                      checked={announcementForm.channels.includes(channel)}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...announcementForm.channels, channel]
                          : announcementForm.channels.filter(c => c !== channel);
                        setAnnouncementForm(f => ({ ...f, channels }));
                      }}
                    />
                  }
                  label={channel.replace('_', ' ').toUpperCase()}
                />
              ))}
            </FormGroup>
            
            <TextField
              label="Schedule For (Optional)"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={announcementForm.scheduled_for || ''}
              onChange={(e) => setAnnouncementForm(f => ({ ...f, scheduled_for: e.target.value || null }))}
            />
            
            <TextField
              label="Expires At (Optional)"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={announcementForm.expires_at || ''}
              onChange={(e) => setAnnouncementForm(f => ({ ...f, expires_at: e.target.value || null }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnouncementDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<SendIcon />}
            onClick={handleSendAnnouncement}
          >
            Send Announcement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Policy Dialog */}
      <Dialog open={policyDialog} onClose={() => setPolicyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPolicy ? 'Edit Notification Policy' : 'Create Notification Policy'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={policyForm.role}
                onChange={(e) => setPolicyForm(f => ({ ...f, role: e.target.value }))}
              >
                {roles.map(role => (
                  <MenuItem key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={policyForm.event_type}
                onChange={(e) => setPolicyForm(f => ({ ...f, event_type: e.target.value }))}
              >
                {eventTypes.map(event => (
                  <MenuItem key={event} value={event}>{event.replace('_', ' ').toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormGroup>
              <Typography variant="subtitle2">Notification Channels</Typography>
              {channels.map(channel => (
                <FormControlLabel
                  key={channel}
                  control={
                    <Checkbox
                      checked={policyForm.channels.includes(channel)}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...policyForm.channels, channel]
                          : policyForm.channels.filter(c => c !== channel);
                        setPolicyForm(f => ({ ...f, channels }));
                      }}
                    />
                  }
                  label={channel.replace('_', ' ').toUpperCase()}
                />
              ))}
            </FormGroup>
            
            <FormControlLabel
              control={
                <Switch
                  checked={policyForm.enabled}
                  onChange={(e) => setPolicyForm(f => ({ ...f, enabled: e.target.checked }))}
                />
              }
              label="Policy Enabled"
            />
            
            <TextField
              label="Message Template (Optional)"
              multiline
              rows={3}
              fullWidth
              value={policyForm.template}
              onChange={(e) => setPolicyForm(f => ({ ...f, template: e.target.value }))}
              placeholder="Custom message template for this notification..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={handleUpdatePolicy}
          >
            {selectedPolicy ? 'Update Policy' : 'Create Policy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
