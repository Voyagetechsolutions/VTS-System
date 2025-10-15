import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Alert,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  GetApp as ExportIcon, Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import AuditTrailTable from '../components/AuditTrailTable';
import AuditTrailDetailsModal from '../components/AuditTrailDetailsModal';

export default function AuditTrailHubTab() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    actionType: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  });

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_trail')
        .select(`
          id,
          created_at,
          action_type,
          message,
          metadata,
          user:user_id(name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);

      // Apply filters
      if (filters.search) {
        query = query.ilike('message', `%${filters.search}%`);
      }
      
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, filters]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Time', 'Type', 'User', 'Message'];
    const csvContent = [
      headers.join(','),
      ...auditLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.action_type,
        log.user?.name || 'System',
        `"${log.message.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock function to create audit log (for demonstration)
  const createSampleAuditLog = async () => {
    try {
      const currentUserId = window.userId || localStorage.getItem('userId');
      
      await supabase.from('audit_trail').insert([
        {
          company_id: companyId,
          user_id: currentUserId,
          action_type: 'System',
          message: `Sample audit log created at ${new Date().toLocaleString()}`,
          metadata: { 
            action: 'sample_creation',
            timestamp: new Date().toISOString()
          }
        }
      ]);

      loadAuditLogs();
    } catch (error) {
      console.error('Error creating sample audit log:', error);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Audit Trail
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAuditLogs}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={createSampleAuditLog}
            size="small"
          >
            Add Sample Log
          </Button>
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={auditLogs.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Keyword Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                placeholder="Search by message, user, booking ID..."
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.actionType}
                  onChange={(e) => handleFilterChange('actionType', e.target.value)}
                  label="Event Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Booking">Booking</MenuItem>
                  <MenuItem value="Trip">Trip</MenuItem>
                  <MenuItem value="Payment">Payment</MenuItem>
                  <MenuItem value="Admin">Admin Actions</MenuItem>
                  <MenuItem value="System">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="From Date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="To Date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Trail Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Audit Records ({auditLogs.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showing last 200 records
            </Typography>
          </Box>
          
          {auditLogs.length === 0 && !loading ? (
            <Alert severity="info">
              No audit records found for the selected filters.
            </Alert>
          ) : (
            <AuditTrailTable 
              logs={auditLogs} 
              loading={loading}
              onViewDetails={handleViewDetails}
            />
          )}
        </CardContent>
      </Card>

      {/* Audit Details Modal */}
      <AuditTrailDetailsModal
        open={showDetailsModal}
        log={selectedLog}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLog(null);
        }}
      />
    </Box>
  );
}
