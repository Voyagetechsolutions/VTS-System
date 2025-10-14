import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import DashboardCard from '../../common/DashboardCard';
import {
  searchCompanyUsers,
  createCompanyUser,
  updateCompanyUser,
  deleteCompanyUser,
  resetUserPassword,
} from '../../../supabase/api';
import { useSnackbar } from 'notistack';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'driver', label: 'Driver' },
  { value: 'agent', label: 'Agent' },
];

const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Active', label: 'Active' },
  { value: 'Suspended', label: 'Suspended' },
];

const statusColor = (status) => {
  if (status === 'Active') return 'success';
  if (status === 'Suspended') return 'error';
  return 'warning';
};

const initialForm = {
  name: '',
  email: '',
  role: 'driver',
  branch: '',
  status: 'Pending',
};

export default function UsersTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filters, setFilters] = useState({ search: '', email: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchName.trim(), email: searchEmail.trim() });
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchName, searchEmail]);

  const loadUsers = async (pageIndex = page, limit = rowsPerPage, activeFilters = filters) => {
    try {
      setLoading(true);
      const { data, error, count } = await searchCompanyUsers({
        search: activeFilters.search,
        email: activeFilters.email,
        page: pageIndex,
        limit,
      });
      if (error) throw error;
      setUsers(data || []);
      setTotal(typeof count === 'number' ? count : (data || []).length);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(0, rowsPerPage, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, rowsPerPage]);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email';
    }
    if (!form.role) nextErrors.role = 'Role is required';
    if (!form.status) nextErrors.status = 'Status is required';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTargetUser(null);
    setForm(initialForm);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        branch: form.branch?.trim() || null,
        status: form.status,
      };
      if (targetUser?.user_id) {
        const { error } = await updateCompanyUser(targetUser.user_id, payload);
        if (error) throw error;
        enqueueSnackbar('User updated', { variant: 'success' });
      } else {
        const { error } = await createCompanyUser(payload);
        if (error) throw error;
        enqueueSnackbar('User created', { variant: 'success' });
      }
      handleCloseDialog();
      loadUsers();
    } catch (error) {
      enqueueSnackbar(error.message || 'Unable to save user', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetUser?.user_id) return;
    try {
      setSaving(true);
      const { error } = await deleteCompanyUser(targetUser.user_id);
      if (error) throw error;
      enqueueSnackbar('User deleted', { variant: 'success' });
      setConfirmOpen(false);
      setTargetUser(null);
      loadUsers(page, rowsPerPage);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete user', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const rowsWithFallback = useMemo(() => {
    return (users || []).map((row) => ({
      ...row,
      status: row.status || (row.is_active ? 'Active' : 'Pending'),
    }));
  }, [users]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DashboardCard
          title="User Management"
          variant="outlined"
          headerAction={(
            <Button variant="contained" onClick={() => { setTargetUser(null); setForm(initialForm); setDialogOpen(true); }}>
              Add User
            </Button>
          )}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Search Name"
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
                fullWidth
              />
              <TextField
                label="Search Email"
                value={searchEmail}
                onChange={(event) => setSearchEmail(event.target.value)}
                fullWidth
              />
            </Stack>

            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ py: 3 }}>
                          <CircularProgress size={20} />
                          <Typography variant="body2">Loading users…</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : rowsWithFallback.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No users found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rowsWithFallback.map((row) => (
                      <TableRow key={row.user_id} hover>
                        <TableCell>{row.name || '-'}</TableCell>
                        <TableCell>{row.email || '-'}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{row.role || '-'}</TableCell>
                        <TableCell>{row.branch || '-'}</TableCell>
                        <TableCell>
                          <Chip size="small" color={statusColor(row.status)} label={row.status || 'Pending'} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Reset Password">
                            <span>
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  if (!row.email) return;
                                  try {
                                    const { error } = await resetUserPassword(row.email);
                                    if (error) throw error;
                                    enqueueSnackbar(`Password reset email sent to ${row.email}`, { variant: 'success' });
                                  } catch (error) {
                                    enqueueSnackbar(error.message || 'Failed to send password reset', { variant: 'error' });
                                  }
                                }}
                              >
                                <LockResetIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setTargetUser(row);
                                setForm({
                                  name: row.name || '',
                                  email: row.email || '',
                                  role: row.role || 'driver',
                                  branch: row.branch || '',
                                  status: row.status || 'Pending',
                                });
                                setDialogOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setTargetUser(row);
                                setConfirmOpen(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => {
                  setPage(newPage);
                  loadUsers(newPage, rowsPerPage, filters);
                }}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  const next = parseInt(event.target.value, 10);
                  setRowsPerPage(next);
                  setPage(0);
                  loadUsers(0, next, filters);
                }}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </Paper>
          </Stack>
        </DashboardCard>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{targetUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              error={Boolean(formErrors.email)}
              helperText={formErrors.email}
              fullWidth
            />
            <FormControl fullWidth error={Boolean(formErrors.role)}>
              <InputLabel id="user-role-label">Role</InputLabel>
              <Select
                labelId="user-role-label"
                label="Role"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                {roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Branch"
              value={form.branch}
              onChange={(event) => setForm((prev) => ({ ...prev, branch: event.target.value }))}
              placeholder="Optional"
              fullWidth
            />
            <FormControl fullWidth error={Boolean(formErrors.status)}>
              <InputLabel id="user-status-label">Status</InputLabel>
              <Select
                labelId="user-status-label"
                label="Status"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => { setConfirmOpen(false); setTargetUser(null); }}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete {targetUser?.name || 'this user'}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmOpen(false); setTargetUser(null); }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
