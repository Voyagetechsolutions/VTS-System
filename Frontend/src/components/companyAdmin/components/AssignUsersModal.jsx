import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControlLabel, Checkbox, Box, Typography, Alert, Grid
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AssignUsersModal({ open, branch, onClose }) {
  const [users, setUsers] = useState([]);
  const [, setAssignedUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (open && branch) {
      loadUsers();
      loadAssignedUsers();
    }
  }, [open, branch]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, email, role')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('branch_users')
        .select('user_id')
        .eq('branch_id', branch.id);

      if (error) throw error;
      
      const assignedUserIds = data.map(item => item.user_id);
      setAssignedUsers(assignedUserIds);
      setSelectedUsers(assignedUserIds);
    } catch (error) {
      console.error('Error loading assigned users:', error);
      setError('Failed to load assigned users');
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');

      // Remove all existing assignments for this branch
      await supabase
        .from('branch_users')
        .delete()
        .eq('branch_id', branch.id);

      // Add new assignments
      if (selectedUsers.length > 0) {
        const assignments = selectedUsers.map(userId => ({
          branch_id: branch.id,
          user_id: userId
        }));

        const { error: insertError } = await supabase
          .from('branch_users')
          .insert(assignments);

        if (insertError) throw insertError;
      }

      onClose();
    } catch (error) {
      console.error('Error updating user assignments:', error);
      setError(error.message || 'Failed to update assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Assign Users to {branch?.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select users to assign to this branch:
          </Typography>

          {loading ? (
            <Typography>Loading users...</Typography>
          ) : (
            <Grid container spacing={1}>
              {users.map((user) => (
                <Grid item xs={12} key={user.user_id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedUsers.includes(user.user_id)}
                        onChange={() => handleUserToggle(user.user_id)}
                        disabled={saving}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email} • {user.role}
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {users.length === 0 && !loading && (
            <Alert severity="info">
              No users found in your company.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : 'Save Assignments'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
