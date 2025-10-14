import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditTrainingModal from './EditTrainingModal';

export default function TrainingTable({ trainingRecords, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure you want to delete the training record for ${record.employee_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('training_certifications')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      onUpdate();
      alert('Training record deleted successfully!');
    } catch (error) {
      console.error('Error deleting training record:', error);
      alert('Error deleting training record: ' + error.message);
    }
  };

  const handleViewCertificate = (record) => {
    if (record.certification_file_url) {
      window.open(record.certification_file_url, '_blank');
    } else {
      alert('No certificate file available for this record');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'assigned': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getDisplayStatus = (record) => {
    if (record.status === 'completed' && isExpired(record.expiry_date)) {
      return 'expired';
    }
    return record.status;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee Name</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Course / Certification</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date Assigned</TableCell>
            <TableCell>Date Completed</TableCell>
            <TableCell>Expiry Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trainingRecords
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {record.employee_name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {record.department || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {record.course_name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getDisplayStatus(record)}
                    color={getStatusColor(getDisplayStatus(record))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(record.date_assigned)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(record.date_completed)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    color={isExpired(record.expiry_date) ? 'error' : 'inherit'}
                  >
                    {formatDate(record.expiry_date)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(record)}
                      title="Edit Training"
                    >
                      <EditIcon />
                    </IconButton>
                    {record.certification_file_url && (
                      <IconButton
                        size="small"
                        onClick={() => handleViewCertificate(record)}
                        title="View Certificate"
                        color="info"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(record)}
                      title="Delete Training"
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
        count={trainingRecords.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Training Modal */}
      <EditTrainingModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        trainingRecord={selectedRecord}
      />
    </>
  );
}
