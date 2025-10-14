import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Typography, Box
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditUsageModal from './EditUsageModal';

export default function UsageTable({ usage, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsage, setSelectedUsage] = useState(null);

  const handleEdit = (usageItem) => {
    setSelectedUsage(usageItem);
    setShowEditModal(true);
  };

  const handleDelete = async (usageItem) => {
    if (!window.confirm(`Are you sure you want to delete this usage record?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_usage')
        .delete()
        .eq('id', usageItem.id);

      if (error) throw error;

      onUpdate();
      alert('Usage record deleted successfully!');
    } catch (error) {
      console.error('Error deleting usage:', error);
      alert('Error deleting usage: ' + error.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Part Name</TableCell>
            <TableCell>Bus</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {usage
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {item.part?.part_name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {item.bus?.name || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.bus?.license_plate || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(item.date)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {item.quantity || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.notes || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(item)}
                      title="Edit Usage"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item)}
                      title="Delete Usage"
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
        count={usage.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Usage Modal */}
      <EditUsageModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        usageItem={selectedUsage}
      />
    </>
  );
}
