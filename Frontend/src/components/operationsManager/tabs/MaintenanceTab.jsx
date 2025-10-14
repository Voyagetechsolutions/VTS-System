import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem } from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function MaintenanceTab() {
  const [incidents, setIncidents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ bus_id: '', driver_id: '', description: '', severity: 'low' });

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.from('incidents').select('incident_id, bus_id, driver_id, description, severity, status, created_at').eq('company_id', window.companyId).order('created_at', { ascending: false });
      setIncidents(data || []);
    };
    loadData();
  }, []);

  const createIncident = async () => {
    await supabase.from('incidents').insert([{ company_id: window.companyId, bus_id: form.bus_id || null, driver_id: form.driver_id || null, description: form.description, severity: form.severity }]);
    setDialogOpen(false);
    setForm({ bus_id: '', driver_id: '', description: '', severity: 'low' });
    const { data } = await supabase.from('incidents').select('incident_id, bus_id, driver_id, description, severity, status, created_at').eq('company_id', window.companyId).order('created_at', { ascending: false });
    setIncidents(data || []);
  };
  const resolveIncident = async (id) => {
    await supabase.from('incidents').update({ status: 'Resolved' }).eq('incident_id', id);
    const { data } = await supabase.from('incidents').select('incident_id, bus_id, driver_id, description, severity, status, created_at').eq('company_id', window.companyId).order('created_at', { ascending: false });
    setIncidents(data || []);
  };

  const exportCSV = () => {
    const head = ['Incident ID','Bus','Driver','Date','Description','Severity','Status'];
    const rows = (incidents||[]).map(i => [i.incident_id, i.bus_id || '', i.driver_id || '', i.created_at || '', (i.description||'').replace(/\n/g,' '), i.severity || '', i.status || '']);
    const csv = [head, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'incidents.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h5">Incidents & Reports</Typography>
      <Box mt={2} display="flex" gap={2}>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>Log Incident</Button>
        <Button variant="outlined" onClick={exportCSV}>Export CSV</Button>
      </Box>
      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Incident ID</TableCell>
              <TableCell>Bus</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(incidents||[]).map((i) => (
              <TableRow key={i.incident_id}>
                <TableCell>{i.incident_id}</TableCell>
                <TableCell>{i.bus_id || '-'}</TableCell>
                <TableCell>{i.driver_id || '-'}</TableCell>
                <TableCell>{new Date(i.created_at).toLocaleString()}</TableCell>
                <TableCell>{i.description}</TableCell>
                <TableCell>{i.severity}</TableCell>
                <TableCell>{i.status}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => resolveIncident(i.incident_id)}>Resolve</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Log Incident</DialogTitle>
        <DialogContent>
          <TextField label="Bus Id" value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))} fullWidth sx={{ mt: 1 }} />
          <TextField label="Driver Id" value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={4} sx={{ mt: 2 }} />
          <Select fullWidth value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createIncident}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
