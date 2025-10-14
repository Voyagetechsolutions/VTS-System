import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, People as AssignUsersIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import EditBranchModal from './EditBranchModal';
import AssignUsersModal from './AssignUsersModal';

export default function BranchesTable({ branches, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleAssignUsers = (branch) => {
    setSelectedBranch(branch);
    setShowAssignModal(true);
  };

  const handleDelete = (branch) => {
    setSelectedBranch(branch);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedBranch) return;

    try {
      setDeleting(true);
      
      // First delete branch_users assignments
      await supabase
        .from('branch_users')
        .delete()
        .eq('branch_id', selectedBranch.id);

      // Then delete the branch
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', selectedBranch.id);

      if (error) throw error;

      setShowDeleteDialog(false);
      setSelectedBranch(null);
      onUpdate();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Error deleting branch: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowAssignModal(false);
    setSelectedBranch(null);
    onUpdate();
  };

  const paginatedBranches = branches.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBranches.map((branch) => (
              <TableRow key={branch.id} hover>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {branch.id.slice(0, 8)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {branch.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {branch.location}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(branch)}
                    title="Edit Branch"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleAssignUsers(branch)}
                    title="Assign Users"
                    color="primary"
                  >
                    <AssignUsersIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(branch)}
                    title="Delete Branch"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={branches.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>

      {/* Edit Branch Modal */}
      {selectedBranch && (
        <EditBranchModal
          open={showEditModal}
          branch={selectedBranch}
          onClose={handleModalClose}
        />
      )}

      {/* Assign Users Modal */}
      {selectedBranch && (
        <AssignUsersModal
          open={showAssignModal}
          branch={selectedBranch}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Branch</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedBranch?.name}"? This action cannot be undone.
            All user assignments to this branch will also be removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
