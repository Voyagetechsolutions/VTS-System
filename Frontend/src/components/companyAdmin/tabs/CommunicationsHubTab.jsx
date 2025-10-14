import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert, Tabs, Tab
} from '@mui/material';
import {
  Add as AddIcon, Message as MessageIcon, Campaign as AnnouncementIcon,
  Send as SendIcon, Edit as DraftIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import CommunicationsMessagesTable from '../components/CommunicationsMessagesTable';
import AnnouncementsTable from '../components/AnnouncementsTable';
import ComposeMessageModal from '../components/ComposeMessageModal';
import ComposeAnnouncementModal from '../components/ComposeAnnouncementModal';

export default function CommunicationsHubTab() {
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showComposeMessage, setShowComposeMessage] = useState(false);
  const [showComposeAnnouncement, setShowComposeAnnouncement] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    keyword: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    unreadMessages: 0,
    totalAnnouncements: 0,
    draftAnnouncements: 0
  });

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(name, email, role),
          recipient:recipient_id(name, email, role)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [companyId]);

  const loadAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: totalMessages },
        { count: unreadMessages },
        { count: totalAnnouncements },
        { count: draftAnnouncements }
      ] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'unread'),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'draft')
      ]);

      setMetrics({
        totalMessages: totalMessages || 0,
        unreadMessages: unreadMessages || 0,
        totalAnnouncements: totalAnnouncements || 0,
        draftAnnouncements: draftAnnouncements || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMessages(),
        loadAnnouncements(),
        loadMetrics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadMessages, loadAnnouncements, loadMetrics]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredMessages = messages.filter(message => {
    const keyword = filters.keyword.toLowerCase();
    return (
      (!filters.role || 
        message.sender?.role === filters.role || 
        message.recipient?.role === filters.role) &&
      (!filters.status || message.status === filters.status) &&
      (!filters.keyword || 
        message.message?.toLowerCase().includes(keyword) ||
        message.sender?.name?.toLowerCase().includes(keyword) ||
        message.recipient?.name?.toLowerCase().includes(keyword))
    );
  });

  const filteredAnnouncements = announcements.filter(announcement => {
    const keyword = filters.keyword.toLowerCase();
    return (
      (!filters.status || announcement.status === filters.status) &&
      (!filters.keyword || 
        announcement.title?.toLowerCase().includes(keyword) ||
        announcement.message?.toLowerCase().includes(keyword))
    );
  });

  const handleMessageSuccess = () => {
    setShowComposeMessage(false);
    loadMessages();
    loadMetrics();
  };

  const handleAnnouncementSuccess = () => {
    setShowComposeAnnouncement(false);
    loadAnnouncements();
    loadMetrics();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Communications
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowComposeMessage(true)}
          >
            Compose Message
          </Button>
          <Button
            variant="contained"
            startIcon={<AnnouncementIcon />}
            onClick={() => setShowComposeAnnouncement(true)}
          >
            Create Announcement
          </Button>
        </Box>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MessageIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalMessages}</Typography>
              <Typography variant="body2" color="text.secondary">Total Messages</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MessageIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.unreadMessages}</Typography>
              <Typography variant="body2" color="text.secondary">Unread Messages</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SendIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.totalAnnouncements}</Typography>
              <Typography variant="body2" color="text.secondary">Announcements</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DraftIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.draftAnnouncements}</Typography>
              <Typography variant="body2" color="text.secondary">Draft Announcements</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search by keyword"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                size="small"
                placeholder="Search messages, names, titles..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="hr_manager">HR Manager</MenuItem>
                  <MenuItem value="booking_officer">Booking Officer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="read">Read</MenuItem>
                  <MenuItem value="unread">Unread</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for Messages and Announcements */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Messages (${filteredMessages.length})`} />
            <Tab label={`Announcements (${filteredAnnouncements.length})`} />
          </Tabs>

          {tabValue === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Messages</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowComposeMessage(true)}
                  size="small"
                >
                  Compose Message
                </Button>
              </Box>
              {filteredMessages.length === 0 ? (
                <Alert severity="info">
                  No messages found. Start a conversation using the "Compose Message" button.
                </Alert>
              ) : (
                <CommunicationsMessagesTable 
                  messages={filteredMessages} 
                  loading={loading}
                  onUpdate={loadMessages}
                />
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Announcements</Typography>
                <Button
                  variant="contained"
                  startIcon={<AnnouncementIcon />}
                  onClick={() => setShowComposeAnnouncement(true)}
                  size="small"
                >
                  Create Announcement
                </Button>
              </Box>
              {filteredAnnouncements.length === 0 ? (
                <Alert severity="info">
                  No announcements found. Create your first announcement using the "Create Announcement" button.
                </Alert>
              ) : (
                <AnnouncementsTable 
                  announcements={filteredAnnouncements} 
                  loading={loading}
                  onUpdate={loadAnnouncements}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ComposeMessageModal
        open={showComposeMessage}
        onClose={() => setShowComposeMessage(false)}
        onSuccess={handleMessageSuccess}
      />

      <ComposeAnnouncementModal
        open={showComposeAnnouncement}
        onClose={() => setShowComposeAnnouncement(false)}
        onSuccess={handleAnnouncementSuccess}
      />
    </Box>
  );
}
