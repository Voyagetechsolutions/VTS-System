import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, Stack, Typography } from '@mui/material';
import { supabase } from '../../../supabase/client';
import { getDrivers, createDriver, updateDriver, assignDriver, suspendDriver, getCompanyRoutes, getCompanyBuses } from '../../../supabase/api';

export default function StaffTab() {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', license_number: '', status: 'available', assigned_route_id: '', assigned_bus_id: '' });
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [view, setView] = useState(null);

  const load = async () => {
    const [{ data: d }, { data: r }, { data: b }] = await Promise.all([
      getDrivers(),
      getCompanyRoutes(),
      getCompanyBuses(),
    ]);
    setStaff(d || []);
    setRoutes(r || []);
    setBuses(b || []);
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);

  const filtered = staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setForm({ name: '', license_number: '', status: 'available', assigned_route_id: '', assigned_bus_id: '' }); setDialogOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, license_number: u.license_number || '', status: u.status || 'available', assigned_route_id: u.assigned_route_id || '', assigned_bus_id: u.assigned_bus_id || '' }); setDialogOpen(true); };
  const save = async () => {
    if (editing) {
      await updateDriver(editing.driver_id, { name: form.name, license_number: form.license_number, status: form.status });
      if (form.assigned_route_id || form.assigned_bus_id) await assignDriver(editing.driver_id, form.assigned_route_id || null, form.assigned_bus_id || null);
    } else {
      await createDriver({ name: form.name, license_number: form.license_number, status: form.status });
    }
    setDialogOpen(false);
    setEditing(null);
    setForm({ name: '', license_number: '', status: 'available', assigned_route_id: '', assigned_bus_id: '' });
    load();
  };

  return (
    <>
      <TextField label="Search Staff" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" onClick={openNew} sx={{ mb: 2, ml: 2 }}>Add Driver</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>License</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Assigned Route</TableCell>
            <TableCell>Assigned Bus</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s) => (
            <TableRow key={s.driver_id}>
              <TableCell>{s.name}</TableCell>
              <TableCell>{s.license_number || '-'}</TableCell>
              <TableCell>{s.status}</TableCell>
              <TableCell>{routes.find(r => r.route_id === s.assigned_route_id)?.origin || '-'} - {routes.find(r => r.route_id === s.assigned_route_id)?.destination || ''}</TableCell>
              <TableCell>{buses.find(b => b.bus_id === s.assigned_bus_id)?.license_plate || '-'}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => openEdit(s)}>Edit</Button>
                <Button size="small" onClick={async () => { try { const { data } = await supabase.from('users').select('*').eq('user_id', s.driver_id).maybeSingle(); setView(data||s); setViewOpen(true); } catch { setView(s); setViewOpen(true); } }}>View</Button>
                <Button size="small" color="warning" onClick={async () => { await suspendDriver(s.driver_id); load(); }}>Suspend</Button>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editing ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mt: 1 }} />
          <TextField label="License Number" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <Select fullWidth value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="on_duty">On Duty</MenuItem>
            <MenuItem value="off_duty">Off Duty</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
          <Select fullWidth value={form.assigned_route_id} onChange={e => setForm(f => ({ ...f, assigned_route_id: e.target.value }))} sx={{ mt: 2 }} displayEmpty>
            <MenuItem value="">Assign Route...</MenuItem>
            {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} - {r.destination}</MenuItem>)}
          </Select>
          <Select fullWidth value={form.assigned_bus_id} onChange={e => setForm(f => ({ ...f, assigned_bus_id: e.target.value }))} sx={{ mt: 2 }} displayEmpty>
            <MenuItem value="">Assign Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Employee Details</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2">Name: {view?.name || '-'}</Typography>
            <Typography variant="body2">Email: {view?.email || '-'}</Typography>
            <Typography variant="body2">Role: {view?.role || 'driver'}</Typography>
            <Typography variant="body2">Phone: {view?.phone || '-'}</Typography>
            <Typography variant="body2">License: {view?.license_number || '-'}</Typography>
            <Typography variant="body2">Status: {view?.status || '-'}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
