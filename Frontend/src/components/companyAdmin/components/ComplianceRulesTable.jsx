import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, CheckCircle as ReviewIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function ComplianceRulesTable({ rules, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleMarkAsReviewed = async (rule) => {
    try {
      const { error } = await supabase
        .from('compliance_rules')
        .update({ status: 'compliant' })
        .eq('id', rule.id);

      if (error) throw error;

      onUpdate();
      alert('Rule marked as reviewed and compliant!');
    } catch (error) {
      console.error('Error updating rule:', error);
      alert('Error updating rule: ' + error.message);
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`Are you sure you want to delete the rule "${rule.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('compliance_rules')
        .delete()
        .eq('id', rule.id);

      if (error) throw error;

      onUpdate();
      alert('Rule deleted successfully!');
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Error deleting rule: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant': return 'success';
      case 'non_compliant': return 'error';
      default: return 'default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'vehicle': return 'primary';
      case 'driver': return 'secondary';
      case 'insurance': return 'info';
      case 'health': return 'warning';
      case 'passenger': return 'success';
      case 'emergency': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const generateRuleId = (rule) => {
    return `CR${rule.id.slice(-6).toUpperCase()}`;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Details</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rules
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {generateRuleId(rule)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={rule.category || 'general'}
                    color={getCategoryColor(rule.category)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {rule.title || 'Untitled Rule'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rule.details || 'No details provided'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={rule.status || 'compliant'}
                    color={getStatusColor(rule.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(rule.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsReviewed(rule)}
                      title="Mark as Reviewed"
                      color="success"
                      disabled={rule.status === 'compliant'}
                    >
                      <ReviewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Edit Rule"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(rule)}
                      title="Delete Rule"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={rules.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
}
