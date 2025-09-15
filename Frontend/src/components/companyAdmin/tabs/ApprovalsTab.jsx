import React, { useEffect, useState } from 'react';
import { 
  Grid, Paper, Typography, Button, Box, Card, CardContent, 
  List, ListItem, ListItemText, ListItemIcon, Chip, Alert, 
  Stack, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import PaidIcon from '@mui/icons-material/Paid';
import RouteIcon from '@mui/icons-material/Route';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import { 
  getPendingApprovals, approveRequest, rejectRequest, 
  getLargeRefunds, getRouteRequests, getMaintenanceRequests, 
  getHRRequests 
} from '../../../supabase/api';

// Company Admin Approvals Dashboard - Meta Control Panel
export default function ApprovalsTab() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [largeRefunds, setLargeRefunds] = useState([]);
  const [routeRequests, setRouteRequests] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [hrRequests, setHrRequests] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    loadApprovalData();
    const interval = setInterval(loadApprovalData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadApprovalData = async () => {
    try {
      const [approvalsRes, refundsRes, routesRes, maintenanceRes, hrRes] = await Promise.all([
        getPendingApprovals(),
        getLargeRefunds(),
        getRouteRequests(),
        getMaintenanceRequests(),
        getHRRequests()
      ]);
      
      setPendingApprovals(approvalsRes.data || []);
      setLargeRefunds(refundsRes.data || []);
      setRouteRequests(routesRes.data || []);
      setMaintenanceRequests(maintenanceRes.data || []);
      setHrRequests(hrRes.data || []);
    } catch (error) {
      console.error('Failed to load approval data:', error);
    }
  };

  const handleApproval = async (approvalId, action, notes = '') => {
    try {
      if (action === 'approve') {
        await approveRequest(approvalId, notes);
      } else {
        await rejectRequest(approvalId, notes);
      }
      setApprovalDialog(false);
      setSelectedApproval(null);
      setApprovalNotes('');
      loadApprovalData();
    } catch (error) {
      console.error('Failed to process approval:', error);
    }
  };

  const openApprovalDialog = (approval) => {
    setSelectedApproval(approval);
    setApprovalDialog(true);
  };

  const getApprovalIcon = (type) => {
    switch (type) {
      case 'refund': return <PaidIcon />;
      case 'route': return <RouteIcon />;
      case 'maintenance': return <BuildIcon />;
      case 'hr': return <PeopleIcon />;
      default: return <WarningIcon />;
    }
  };

  const getApprovalColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Approvals & Oversight</Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">Pending Approvals</Typography>
            <Typography variant="h4" color="primary">{pendingApprovals.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">Large Refunds</Typography>
            <Typography variant="h4" color="warning.main">{largeRefunds.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">Route Requests</Typography>
            <Typography variant="h4" color="info.main">{routeRequests.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper className="kpi-card" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="secondary.main">Maintenance</Typography>
            <Typography variant="h4" color="secondary.main">{maintenanceRequests.length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Large Refunds Approval */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PaidIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Large Refunds Requiring Approval
              </Typography>
              {largeRefunds.length === 0 ? (
                <Alert severity="success">No large refunds pending approval</Alert>
              ) : (
                <List dense>
                  {largeRefunds.map((refund) => (
                    <ListItem key={refund.refund_id}>
                      <ListItemIcon>
                        <PaidIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${formatCurrency(refund.amount)} - ${refund.passenger_name}`}
                        secondary={`Booking: ${refund.booking_id} • ${refund.reason}`}
                      />
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => openApprovalDialog({...refund, type: 'refund'})}
                      >
                        Review
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Route Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <RouteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Route & Schedule Requests
              </Typography>
              {routeRequests.length === 0 ? (
                <Alert severity="success">No route requests pending</Alert>
              ) : (
                <List dense>
                  {routeRequests.map((request) => (
                    <ListItem key={request.request_id}>
                      <ListItemIcon>
                        <RouteIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={request.route_name}
                        secondary={`${request.action} • ${request.requested_by}`}
                      />
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => openApprovalDialog({...request, type: 'route'})}
                      >
                        Review
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Major Maintenance Requests
              </Typography>
              {maintenanceRequests.length === 0 ? (
                <Alert severity="success">No major maintenance requests</Alert>
              ) : (
                <List dense>
                  {maintenanceRequests.map((request) => (
                    <ListItem key={request.request_id}>
                      <ListItemIcon>
                        <BuildIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Bus ${request.bus_number} - ${request.work_type}`}
                        secondary={`${formatCurrency(request.estimated_cost)} • ${request.priority}`}
                      />
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => openApprovalDialog({...request, type: 'maintenance'})}
                      >
                        Review
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* HR Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                HR Actions Requiring Approval
              </Typography>
              {hrRequests.length === 0 ? (
                <Alert severity="success">No HR actions pending approval</Alert>
              ) : (
                <List dense>
                  {hrRequests.map((request) => (
                    <ListItem key={request.request_id}>
                      <ListItemIcon>
                        <PeopleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${request.action} - ${request.employee_name}`}
                        secondary={`${request.department} • ${request.requested_by}`}
                      />
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => openApprovalDialog({...request, type: 'hr'})}
                      >
                        Review
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* All Pending Approvals */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                All Pending Approvals
              </Typography>
              {pendingApprovals.length === 0 ? (
                <Alert severity="success">No pending approvals</Alert>
              ) : (
                <List dense>
                  {pendingApprovals.map((approval) => (
                    <ListItem key={approval.approval_id}>
                      <ListItemIcon>
                        {getApprovalIcon(approval.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={approval.title}
                        secondary={`${approval.description} • Priority: ${approval.priority}`}
                      />
                      <Chip 
                        label={approval.priority} 
                        color={getApprovalColor(approval.priority)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => openApprovalDialog(approval)}
                      >
                        Review
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Review Approval Request
          {selectedApproval && (
            <Chip 
              label={selectedApproval.priority} 
              color={getApprovalColor(selectedApproval.priority)}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedApproval && (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedApproval.title}</Typography>
              <Typography variant="body1" paragraph>{selectedApproval.description}</Typography>
              
              {selectedApproval.type === 'refund' && (
                <Box>
                  <Typography variant="subtitle1">Refund Details:</Typography>
                  <Typography>Amount: {formatCurrency(selectedApproval.amount)}</Typography>
                  <Typography>Passenger: {selectedApproval.passenger_name}</Typography>
                  <Typography>Reason: {selectedApproval.reason}</Typography>
                </Box>
              )}
              
              {selectedApproval.type === 'maintenance' && (
                <Box>
                  <Typography variant="subtitle1">Maintenance Details:</Typography>
                  <Typography>Bus: {selectedApproval.bus_number}</Typography>
                  <Typography>Work Type: {selectedApproval.work_type}</Typography>
                  <Typography>Estimated Cost: {formatCurrency(selectedApproval.estimated_cost)}</Typography>
                  <Typography>Priority: {selectedApproval.priority}</Typography>
                </Box>
              )}
              
              <TextField
                label="Approval Notes"
                multiline
                rows={3}
                fullWidth
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Add any notes or conditions for this approval..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<CancelIcon />}
            onClick={() => handleApproval(selectedApproval?.approval_id, 'reject', approvalNotes)}
          >
            Reject
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<CheckCircleIcon />}
            onClick={() => handleApproval(selectedApproval?.approval_id, 'approve', approvalNotes)}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
