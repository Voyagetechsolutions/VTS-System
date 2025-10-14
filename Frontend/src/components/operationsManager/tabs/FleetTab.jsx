import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import { getFleetStatus, markBusDelayed, assignBusToRoute, createBus, updateBus, getCompanyRoutes } from '../../../supabase/api';
import EditIcon from '@mui/icons-material/Edit';

export default function FleetTab() {
  const [fleet, setFleet] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: '', model: '', license_plate: '', capacity: 50, config: '2x2', features: { wifi: false, ac: false, charging: false, recliner: false, toilet: false }, insured: false, permit_number: '', status: 'Active' });
  const [routes, setRoutes] = useState([]);
  const [assign, setAssign] = useState({ bus_id: '', route_id: '' });

  useEffect(() => {
    const loadData = async () => {
      const [{ data: buses }, { data: r }] = await Promise.all([
        getFleetStatus(),
        getCompanyRoutes(),
      ]);
      setFleet(buses || []);
      setRoutes(r || []);
    };
    loadData();
  }, []);

  const filtered = fleet.filter(b => b.license_plate.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setForm({ name: '', type: '', model: '', license_plate: '', capacity: 50, config: '2x2', features: { wifi: false, ac: false, charging: false, recliner: false, toilet: false }, insured: false, permit_number: '', status: 'Active' }); setDialogOpen(true); };
  const openEdit = (b) => { setEditing(b); setForm({ name: b.name||'', type: b.type||'', model: b.model||'', license_plate: b.license_plate||'', capacity: b.capacity||50, config: b.config||'2x2', features: b.features||{ wifi:false, ac:false, charging:false, recliner:false, toilet:false }, insured: !!b.insured, permit_number: b.permit_number||'', status: b.status||'Active' }); setDialogOpen(true); };
  const save = async () => {
    const payload = { name: form.name, type: form.type, model: form.model, license_plate: form.license_plate, capacity: Number(form.capacity||0), config: form.config, features: form.features, insured: !!form.insured, permit_number: form.permit_number || null, status: form.status };
    if (editing) { await updateBus(editing.bus_id, payload); } else { await createBus(payload); }
    setDialogOpen(false);
    setEditing(null);
    setForm({ name: '', type: '', model: '', license_plate: '', capacity: 50, config: '2x2', features: { wifi: false, ac: false, charging: false, recliner: false, toilet: false }, insured: false, permit_number: '', status: 'Active' });
    const [{ data: buses }, { data: r }] = await Promise.all([
      getFleetStatus(),
      getCompanyRoutes(),
    ]);
    setFleet(buses || []);
    setRoutes(r || []);
  };

  const openAssign = (bus) => { setAssign({ bus_id: bus.bus_id, route_id: '' }); setAssignOpen(true); };
  const doAssign = async () => {
    if (assign.bus_id && assign.route_id) await assignBusToRoute(assign.bus_id, assign.route_id);
    setAssignOpen(false);
    setAssign({ bus_id: '', route_id: '' });
    const [{ data: buses }, { data: r }] = await Promise.all([
      getFleetStatus(),
      getCompanyRoutes(),
    ]);
    setFleet(buses || []);
    setRoutes(r || []);
  };

  return (
    <>
      <TextField label="Search Buses" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" sx={{ mb: 2, ml: 2 }} onClick={openNew}>Add Bus</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>License Plate</TableCell>
            <TableCell>Model</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Assigned Route</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => (
            <TableRow key={b.bus_id}>
              <TableCell>{b.license_plate}</TableCell>
              <TableCell>{b.model || '-'}</TableCell>
              <TableCell>{b.status}</TableCell>
              <TableCell>{b.location}</TableCell>
              <TableCell>{b.route}</TableCell>
              <TableCell>
                <Button size="small" color="warning" onClick={() => markBusDelayed(b.bus_id)}>Mark Delayed</Button>
                <Button size="small" color="primary" onClick={() => openAssign(b)}>Assign to Route</Button>
                <IconButton onClick={() => openEdit(b)}><EditIcon /></IconButton>
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
        <DialogTitle>{editing ? 'Edit Bus' : 'Add Bus'}</DialogTitle>
        <DialogContent>
          <TextField label="Bus Name / Identifier" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mt: 1 }} />
          <Select fullWidth value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} displayEmpty sx={{ mt: 2 }}>
            <MenuItem value="">Select Bus Type...</MenuItem>
            <MenuItem value="Luxury">Luxury</MenuItem>
            <MenuItem value="Semi-Luxury">Semi-Luxury</MenuItem>
            <MenuItem value="Economy">Economy</MenuItem>
          </Select>
          <TextField label="Model (optional)" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Number Plate" value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Seating Capacity" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <Select fullWidth value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="2x2">2x2</MenuItem>
            <MenuItem value="2x3">2x3</MenuItem>
          </Select>
          <FormControlLabel control={<Checkbox checked={!!form.features.wifi} onChange={e => setForm(f => ({ ...f, features: { ...f.features, wifi: e.target.checked } }))} />} label="WiFi" />
          <FormControlLabel control={<Checkbox checked={!!form.features.ac} onChange={e => setForm(f => ({ ...f, features: { ...f.features, ac: e.target.checked } }))} />} label="AC" />
          <FormControlLabel control={<Checkbox checked={!!form.features.charging} onChange={e => setForm(f => ({ ...f, features: { ...f.features, charging: e.target.checked } }))} />} label="Charging Ports" />
          <FormControlLabel control={<Checkbox checked={!!form.features.recliner} onChange={e => setForm(f => ({ ...f, features: { ...f.features, recliner: e.target.checked } }))} />} label="Recliner Seats" />
          <FormControlLabel control={<Checkbox checked={!!form.features.toilet} onChange={e => setForm(f => ({ ...f, features: { ...f.features, toilet: e.target.checked } }))} />} label="Toilet" />
          <FormControlLabel control={<Checkbox checked={!!form.insured} onChange={e => setForm(f => ({ ...f, insured: e.target.checked }))} />} label="Insured" />
          <TextField label="Permit Number (optional)" value={form.permit_number} onChange={e => setForm(f => ({ ...f, permit_number: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <Select fullWidth value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
            <MenuItem value="Retired">Retired</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)}>
        <DialogTitle>Assign Bus to Route</DialogTitle>
        <DialogContent>
          <Select fullWidth value={assign.route_id} onChange={e => setAssign(a => ({ ...a, route_id: e.target.value }))} sx={{ mt: 1 }} displayEmpty>
            <MenuItem value="">Select Route...</MenuItem>
            {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} - {r.destination}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={doAssign} disabled={!assign.route_id}>Assign</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
