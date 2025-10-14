import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert, Tabs, Tab
} from '@mui/material';
import {
  Add as AddIcon, Rule as RuleIcon, Warning as IssueIcon,
  CheckCircle as CompliantIcon, Error as NonCompliantIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import ComplianceRulesTable from '../components/ComplianceRulesTable';
import SafetyLogsTable from '../components/SafetyLogsTable';
import AddRuleModal from '../components/AddRuleModal';
import ReportIncidentModal from '../components/ReportIncidentModal';

export default function ComplianceHubTab() {
  const [rules, setRules] = useState([]);
  const [safetyLogs, setSafetyLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddRule, setShowAddRule] = useState(false);
  const [showReportIncident, setShowReportIncident] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalRules: 0,
    compliantRules: 0,
    nonCompliantRules: 0,
    openIssues: 0
  });

  const loadRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error loading compliance rules:', error);
    }
  }, [companyId]);

  const loadSafetyLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('safety_logs')
        .select(`
          *,
          reporter:reported_by(name, email)
        `)
        .eq('company_id', companyId)
        .order('reported_at', { ascending: false });

      if (error) throw error;
      setSafetyLogs(data || []);
    } catch (error) {
      console.error('Error loading safety logs:', error);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: totalRules },
        { count: compliantRules },
        { count: nonCompliantRules },
        { count: openIssues }
      ] = await Promise.all([
        supabase.from('compliance_rules').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('compliance_rules').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'compliant'),
        supabase.from('compliance_rules').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'non_compliant'),
        supabase.from('safety_logs').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'open')
      ]);

      setMetrics({
        totalRules: totalRules || 0,
        compliantRules: compliantRules || 0,
        nonCompliantRules: nonCompliantRules || 0,
        openIssues: openIssues || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRules(),
        loadSafetyLogs(),
        loadMetrics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadRules, loadSafetyLogs, loadMetrics]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredRules = rules.filter(rule => {
    return (
      (!filters.category || rule.category === filters.category) &&
      (!filters.status || rule.status === filters.status)
    );
  });

  const filteredSafetyLogs = safetyLogs.filter(log => {
    const logDate = new Date(log.reported_at).toISOString().split('T')[0];
    return (
      (!filters.category || log.category === filters.category) &&
      (!filters.status || log.status === filters.status) &&
      (!filters.startDate || logDate >= filters.startDate) &&
      (!filters.endDate || logDate <= filters.endDate)
    );
  });

  const handleRuleSuccess = () => {
    setShowAddRule(false);
    loadRules();
    loadMetrics();
  };

  const handleIncidentSuccess = () => {
    setShowReportIncident(false);
    loadSafetyLogs();
    loadMetrics();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Compliance & Safety
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<IssueIcon />}
            onClick={() => setShowReportIncident(true)}
          >
            Report Incident
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddRule(true)}
          >
            Add Rule
          </Button>
        </Box>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <RuleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalRules}</Typography>
              <Typography variant="body2" color="text.secondary">Total Rules</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CompliantIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.compliantRules}</Typography>
              <Typography variant="body2" color="text.secondary">Compliant</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <NonCompliantIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.nonCompliantRules}</Typography>
              <Typography variant="body2" color="text.secondary">Non-Compliant</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <IssueIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">{metrics.openIssues}</Typography>
              <Typography variant="body2" color="text.secondary">Open Issues</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="vehicle">Vehicle</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                  <MenuItem value="health">Health</MenuItem>
                  <MenuItem value="passenger">Passenger</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="compliant">Compliant</MenuItem>
                  <MenuItem value="non_compliant">Non-Compliant</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for Rules and Safety Logs */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Compliance Rules (${filteredRules.length})`} />
            <Tab label={`Safety Logs (${filteredSafetyLogs.length})`} />
          </Tabs>

          {tabValue === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Compliance Rules</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddRule(true)}
                  size="small"
                >
                  Add Rule
                </Button>
              </Box>
              {filteredRules.length === 0 ? (
                <Alert severity="info">
                  No compliance rules found. Add your first rule using the "Add Rule" button.
                </Alert>
              ) : (
                <ComplianceRulesTable 
                  rules={filteredRules} 
                  loading={loading}
                  onUpdate={loadRules}
                />
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Safety Logs</Typography>
                <Button
                  variant="contained"
                  startIcon={<IssueIcon />}
                  onClick={() => setShowReportIncident(true)}
                  size="small"
                >
                  Report Incident
                </Button>
              </Box>
              {filteredSafetyLogs.length === 0 ? (
                <Alert severity="info">
                  No safety incidents found. Report your first incident using the "Report Incident" button.
                </Alert>
              ) : (
                <SafetyLogsTable 
                  safetyLogs={filteredSafetyLogs} 
                  loading={loading}
                  onUpdate={loadSafetyLogs}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddRuleModal
        open={showAddRule}
        onClose={() => setShowAddRule(false)}
        onSuccess={handleRuleSuccess}
      />

      <ReportIncidentModal
        open={showReportIncident}
        onClose={() => setShowReportIncident(false)}
        onSuccess={handleIncidentSuccess}
      />
    </Box>
  );
}
