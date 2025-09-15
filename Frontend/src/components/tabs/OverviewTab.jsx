import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem } from '@mui/material';
import { useSnackbar } from 'notistack';
// Removed legacy services/api usage
import BarChart from '../charts/BarChart';
import { getSystemKPIs } from '../../supabase/api';

export default function OverviewTab() {
  const [kpis, setKpis] = useState({});
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState({ id: '', name: '', isActive: true });
  const { enqueueSnackbar } = useSnackbar?.() || { enqueueSnackbar: () => {} };
  useEffect(() => {
    getSystemKPIs().then(res => setKpis(res.data || {}));
  }, []);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline">Companies</Typography>
            <Typography variant="h5">{kpis.ActiveCompanies || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline">Users</Typography>
            <Typography variant="h5">{kpis.Users || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline">Routes</Typography>
            <Typography variant="h5">{kpis.Routes || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline">Buses</Typography>
            <Typography variant="h5">{kpis.Buses || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box mt={3} display="flex" gap={2} flexWrap="wrap">
        <Button variant="contained" onClick={() => { setMode('create'); setForm({ id: '', name: '', isActive: true }); setOpen(true); }}>Create Company</Button>
        <Button variant="outlined" onClick={() => { const id = prompt('Company ID to edit:'); if (!id) return; setMode('edit'); setForm({ id, name: '', isActive: true }); setOpen(true); }}>Edit Company</Button>
        <Button variant="outlined" color="error" disabled>Delete Company</Button>
      </Box>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Top Companies</Typography>
          <BarChart data={kpis.TopCompanies || []} xKey="name" yKey="score" />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Worst Companies</Typography>
          <BarChart data={kpis.WorstCompanies || []} xKey="name" yKey="score" />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Top Routes</Typography>
          <BarChart data={kpis.TopRoutes || []} xKey="name" yKey="score" />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Worst Routes</Typography>
          <BarChart data={kpis.WorstRoutes || []} xKey="name" yKey="score" />
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{mode === 'create' ? 'Create Company' : 'Edit Company'}</DialogTitle>
        <DialogContent>
          {mode === 'edit' && <TextField label="Company ID" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} fullWidth sx={{ mt: 1 }} />}
          <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <Select fullWidth value={form.isActive ? 'Active' : 'Inactive'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'Active' }))} sx={{ mt: 2 }}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            enqueueSnackbar('Action not available in this build', { variant: 'info' });
            setOpen(false);
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
