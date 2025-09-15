import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getIncidents, reportIncident, resolveIncident } from '../../../supabase/api';

export default function IncidentTab() {
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    getIncidents().then(({ data }) => setIncidents(data || []));
  }, []);

  const filtered = incidents.filter(i => i.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField label="Search Incidents" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setOpen(true)}>Report Incident</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Reported At</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => (
            <TableRow key={i.incident_id}>
              <TableCell>{i.description}</TableCell>
              <TableCell>{i.status}</TableCell>
              <TableCell>{i.reported_at}</TableCell>
              <TableCell>
                <Button size="small" color="success" onClick={() => resolveIncident(i.incident_id)}>Resolve</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Report Incident</DialogTitle>
        <DialogContent>
          <TextField label="Description" fullWidth value={desc} onChange={e => setDesc(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { reportIncident(desc); setOpen(false); setDesc(''); }}>Submit</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
