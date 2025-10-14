import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Divider, Chip
} from '@mui/material';
import {
  Person as PersonIcon, Schedule as TimeIcon, Category as TypeIcon,
  Code as MetadataIcon
} from '@mui/icons-material';

export default function AuditTrailDetailsModal({ open, log, onClose }) {
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionTypeColor = (type) => {
    switch (type) {
      case 'Booking': return 'primary';
      case 'Trip': return 'info';
      case 'Payment': return 'success';
      case 'Admin': return 'warning';
      case 'System': return 'default';
      default: return 'default';
    }
  };

  const formatMetadata = (metadata) => {
    if (!metadata) return 'No additional data';
    
    try {
      return JSON.stringify(metadata, null, 2);
    } catch (error) {
      return 'Invalid metadata format';
    }
  };

  if (!log) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Audit Log Details</Typography>
          <Chip 
            label={log.action_type} 
            color={getActionTypeColor(log.action_type)}
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 1 }}>
          {/* Basic Information */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimeIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Timestamp</Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {formatDateTime(log.created_at)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Log ID: {log.id}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* User Information */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">User</Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {log.user?.name || 'System User'}
            </Typography>
            {log.user?.email && (
              <Typography variant="body2" color="text.secondary">
                {log.user.email}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Action Type */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TypeIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Action Type</Typography>
            </Box>
            <Chip 
              label={log.action_type} 
              color={getActionTypeColor(log.action_type)}
              size="medium"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Message */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Message</Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: 1,
              borderColor: 'grey.200'
            }}>
              <Typography variant="body1">
                {log.message}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Metadata */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MetadataIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Additional Data</Typography>
            </Box>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.900', 
              borderRadius: 1,
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: 200,
              overflow: 'auto'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {formatMetadata(log.metadata)}
              </pre>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
