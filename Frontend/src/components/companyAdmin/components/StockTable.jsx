import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditStockModal from './EditStockModal';

export default function StockTable({ stock, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  const handleEdit = (stockItem) => {
    setSelectedStock(stockItem);
    setShowEditModal(true);
  };

  const handleDelete = async (stockItem) => {
    if (!window.confirm(`Are you sure you want to delete "${stockItem.part_name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_stock')
        .delete()
        .eq('id', stockItem.id);

      if (error) throw error;

      onUpdate();
      alert('Stock item deleted successfully!');
    } catch (error) {
      console.error('Error deleting stock:', error);
      alert('Error deleting stock: ' + error.message);
    }
  };

  const getStatusColor = (status, quantity, reorderLevel) => {
    if (status === 'out_of_stock' || quantity === 0) return 'error';
    if (status === 'low' || quantity <= reorderLevel) return 'warning';
    return 'success';
  };

  const getStatusLabel = (status, quantity, reorderLevel) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= reorderLevel) return 'Low Stock';
    return 'Available';
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Part Name</TableCell>
            <TableCell>Part Number</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Reorder Level</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stock
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {item.part_name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {item.part_number || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {item.category || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {item.quantity || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {item.reorder_level || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(item.status, item.quantity, item.reorder_level)}
                    color={getStatusColor(item.status, item.quantity, item.reorder_level)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(item)}
                      title="Edit Stock"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item)}
                      title="Delete Stock"
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
        count={stock.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Edit Stock Modal */}
      <EditStockModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
        stockItem={selectedStock}
      />
    </>
  );
}
