import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Receipt as ReceiptIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditPayrollModal from './EditPayrollModal';

export default function PayrollTable({ payrollRecords, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure you want to delete the payroll record for ${record.employee_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      onUpdate();
      alert('Payroll record deleted successfully!');
    } catch (error) {
      console.error('Error deleting payroll record:', error);
      alert('Error deleting payroll record: ' + error.message);
    }
  };

  const handleGeneratePayslip = (record) => {
    // In a real implementation, this would generate a PDF payslip
    alert(`Generating payslip for ${record.employee_name}...`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatMonth = (month) => {
    if (!month) return 'N/A';
    return new Date(month + '-01').toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Month</TableCell>
            <TableCell>Net Pay</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Payment Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payrollRecords
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
                    {record.role || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatMonth(record.month)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium" color="primary">
                    {formatCurrency(record.net_pay)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={record.status || 'pending'}
                    color={getStatusColor(record.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(record.payment_date)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(record)}
                      title="Edit Record"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleGeneratePayslip(record)}
                      title="Generate Payslip"
                      color="info"
                    >
                      <ReceiptIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(record)}
                      title="Delete Record"
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
        count={payrollRecords.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Payroll Modal */}
      <EditPayrollModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        payrollRecord={selectedRecord}
      />
    </>
  );
}
