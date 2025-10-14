import { useState } from 'react';
import {
  TablePagination, IconButton, Typography, Box, Switch, FormControlLabel,
  Card, CardContent, Grid, Alert
} from '@mui/material';
import {
  Security as SecurityIcon
} from '@mui/icons-material';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'User Management' },
  { key: 'fleet', label: 'Fleet Management' },
  { key: 'routes', label: 'Routes Management' },
  { key: 'trips', label: 'Trip Management' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'staff', label: 'Staff Management' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' }
];

const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    permissions: { view: true, edit: true, approve: true },
    module_visibility: Object.fromEntries(MODULES.map(m => [m.key, true]))
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Human resources management',
    permissions: { view: true, edit: true, approve: false },
    module_visibility: {
      dashboard: true, users: true, staff: true, payroll: true, 
      reports: true, settings: false, fleet: false, routes: false,
      trips: false, bookings: false, inventory: false, maintenance: false
    }
  },
  {
    id: 'operations_manager',
    name: 'Operations Manager',
    description: 'Fleet and operations management',
    permissions: { view: true, edit: true, approve: true },
    module_visibility: {
      dashboard: true, fleet: true, routes: true, trips: true,
      maintenance: true, inventory: true, reports: true, users: false,
      staff: false, payroll: false, bookings: true, settings: false
    }
  },
  {
    id: 'booking_officer',
    name: 'Booking Officer',
    description: 'Customer bookings and ticketing',
    permissions: { view: true, edit: true, approve: false },
    module_visibility: {
      dashboard: true, bookings: true, routes: true, trips: true,
      reports: false, users: false, staff: false, payroll: false,
      fleet: false, maintenance: false, inventory: false, settings: false
    }
  },
  {
    id: 'driver',
    name: 'Driver',
    description: 'Driver portal access',
    permissions: { view: true, edit: false, approve: false },
    module_visibility: {
      dashboard: true, trips: true, routes: true, bookings: false,
      users: false, staff: false, payroll: false, fleet: false,
      maintenance: false, inventory: false, reports: false, settings: false
    }
  }
];

export default function RolesTable({ loading }) {
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleModuleVisibilityChange = (roleId, moduleKey, visible) => {
    setRoles(prevRoles => 
      prevRoles.map(role => 
        role.id === roleId 
          ? { 
              ...role, 
              module_visibility: { 
                ...role.module_visibility, 
                [moduleKey]: visible 
              } 
            }
          : role
      )
    );
  };

  const handlePermissionChange = (roleId, permission, value) => {
    setRoles(prevRoles => 
      prevRoles.map(role => 
        role.id === roleId 
          ? { 
              ...role, 
              permissions: { 
                ...role.permissions, 
                [permission]: value 
              } 
            }
          : role
      )
    );
  };

  const handleSaveRoles = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // In a real implementation, you would save to Supabase
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Role settings saved successfully!');
    } catch (error) {
      console.error('Error saving roles:', error);
      setError('Error saving role settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {roles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((role) => (
          <Grid item xs={12} key={role.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{role.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {role.description}
                    </Typography>
                  </Box>
                </Box>

                {/* Permissions */}
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Permissions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={role.permissions.view}
                        onChange={(e) => handlePermissionChange(role.id, 'view', e.target.checked)}
                        disabled={loading || saving}
                      />
                    }
                    label="View"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={role.permissions.edit}
                        onChange={(e) => handlePermissionChange(role.id, 'edit', e.target.checked)}
                        disabled={loading || saving}
                      />
                    }
                    label="Edit"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={role.permissions.approve}
                        onChange={(e) => handlePermissionChange(role.id, 'approve', e.target.checked)}
                        disabled={loading || saving}
                      />
                    }
                    label="Approve"
                  />
                </Box>

                {/* Module Visibility */}
                <Typography variant="subtitle2" gutterBottom>
                  Module Access
                </Typography>
                <Grid container spacing={1}>
                  {MODULES.map((module) => (
                    <Grid item xs={6} sm={4} md={3} key={module.key}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={role.module_visibility[module.key] || false}
                            onChange={(e) => handleModuleVisibilityChange(role.id, module.key, e.target.checked)}
                            disabled={loading || saving}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {module.label}
                          </Typography>
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <TablePagination
          component="div"
          count={roles.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
        
        <Box>
          <IconButton
            onClick={handleSaveRoles}
            disabled={loading || saving}
            color="primary"
            size="large"
            title="Save Role Settings"
          >
            <SecurityIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
