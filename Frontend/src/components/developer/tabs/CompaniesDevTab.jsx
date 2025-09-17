import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Edit as EditIcon, Pause as PauseIcon, PlayArrow as PlayIcon, Business as BusinessIcon, Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { getAllCompanies, verifyCompany, suspendCompany, changeCompanyPlan, getCompaniesLight, createCompanyWithAdmin } from '../../../supabase/api';
import DashboardCard from '../../common/DashboardCard';
import { ModernSelect, ModernTextField, ModernButton } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function CompaniesDevTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [companies, setCompanies] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Modal states
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Create company form state
  const [newCompany, setNewCompany] = useState({
    name: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: '',
    plan: 'Basic',
    status: 'Active'
  });

  const load = async () => {
    setLoading(true);
    const res = await getAllCompanies();
    setRows(res.data || []);
    const cl = await getCompaniesLight();
    setCompanies(cl.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const inRange = (d) => {
    const ts = d ? new Date(d).getTime() : null;
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() : null;
    if (ts == null) return true;
    if (fromTs != null && ts < fromTs) return false;
    if (toTs != null && ts > toTs) return false;
    return true;
  };

  const filtered = rows.filter(r => (
    (companyFilter ? r.company_id === companyFilter : true) &&
    (statusFilter ? (statusFilter === 'active' ? r.is_active : !r.is_active) : true) &&
    (planFilter ? r.plan === planFilter : true) &&
    ((searchName || '').trim() === '' ? true : (r.name || '').toLowerCase().includes(searchName.toLowerCase())) &&
    ((searchEmail || '').trim() === '' ? true : (r.email || '').toLowerCase().includes(searchEmail.toLowerCase())) &&
    inRange(r.created_at)
  ));

  const exportCSV = () => {
    if (!filtered.length) return;
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateCompany = async () => {
    try {
      await createCompanyWithAdmin(newCompany, {});
      setShowCreateCompany(false);
      setNewCompany({ name: '', registrationNumber: '', email: '', phone: '', address: '', plan: 'Basic', status: 'Active' });
      load();
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setShowCompanyProfile(true);
  };

  const actions = [
    { 
      label: 'View', 
      icon: <ViewIcon />, 
      onClick: ({ row }) => handleViewCompany(row),
      color: 'primary'
    },
    { 
      label: 'Edit', 
      icon: <EditIcon />, 
      onClick: async ({ row }) => { 
        // TODO: Implement edit functionality
        console.log('Edit company:', row);
      },
      color: 'info'
    },
    { 
      label: row => row.is_active ? 'Suspend' : 'Activate', 
      icon: row => row.is_active ? <PauseIcon /> : <PlayIcon />, 
      onClick: async ({ row }) => { 
        await suspendCompany(row.company_id); 
        load(); 
      }, 
      color: row => row.is_active ? 'error' : 'success'
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Companies
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateCompany(true)}
          >
            Create Company
          </Button>
          <Button
            variant="outlined"
            onClick={exportCSV}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Search by Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Search by Email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Plan</InputLabel>
                <Select
                  value={planFilter}
                  label="Plan"
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardContent>
          <DataTable
            data={filtered}
            loading={loading}
            columns={[
              { 
                field: 'name', 
                headerName: 'Company Name', 
                sortable: true,
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon color="primary" />
                    <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'email', 
                headerName: 'Contact Email',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    {params.value}
                  </Box>
                )
              },
              { 
                field: 'plan', 
                headerName: 'Plan',
                renderCell: (params) => (
                  <Chip 
                    label={params.value || 'Basic'} 
                    color={params.value === 'Premium' ? 'primary' : params.value === 'Standard' ? 'secondary' : 'default'}
                    size="small"
                  />
                )
              },
              { 
                field: 'is_active', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value ? 'Active' : 'Inactive'} 
                    color={params.value ? 'success' : 'error'}
                    size="small"
                  />
                )
              },
              { field: 'created_at', headerName: 'Created On', type: 'date', sortable: true },
            ]}
            rowActions={actions}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Create Company Modal */}
      <Dialog open={showCreateCompany} onClose={() => setShowCreateCompany(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Company</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Registration Number"
                value={newCompany.registrationNumber}
                onChange={(e) => setNewCompany({...newCompany, registrationNumber: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={newCompany.email}
                onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newCompany.phone}
                onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Address"
                multiline
                rows={2}
                value={newCompany.address}
                onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Plan</InputLabel>
                <Select
                  value={newCompany.plan}
                  label="Default Plan"
                  onChange={(e) => setNewCompany({...newCompany, plan: e.target.value})}
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newCompany.status}
                  label="Status"
                  onChange={(e) => setNewCompany({...newCompany, status: e.target.value})}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateCompany(false)}>Cancel</Button>
          <Button onClick={handleCreateCompany} variant="contained">Create Company</Button>
        </DialogActions>
      </Dialog>

      {/* Company Profile Modal */}
      <Dialog open={showCompanyProfile} onClose={() => setShowCompanyProfile(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon />
            {selectedCompany?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCompany && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                <Typography variant="body1">{selectedCompany.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedCompany.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedCompany.is_active ? 'Active' : 'Inactive'} 
                  color={selectedCompany.is_active ? 'success' : 'error'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created On</Typography>
                <Typography variant="body1">
                  {new Date(selectedCompany.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompanyProfile(false)}>Close</Button>
          <Button variant="contained">Edit Company</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
