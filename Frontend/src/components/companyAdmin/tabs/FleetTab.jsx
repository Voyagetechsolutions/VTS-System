import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, Checkbox, FormControlLabel, Alert, Stack, Divider } from '@mui/material';
import { getCompanyBuses, createBus, updateBus, deleteBus, getDrivers, getCompanySettings } from '../../../supabase/api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function FleetTab() {
  const [buses, setBuses] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsForm, setActionsForm] = useState({ make: '', year_of_manufacture: '', ownership_company: '', insurance_details: '', permit_number: '', roadworthiness_certificate_no: '', roadworthiness_issued_at: '', roadworthiness_expires_at: '', health_status: '', status_notes: '' });
  const [drivers, setDrivers] = useState([]);
  const [assign, setAssign] = useState({ driver_id: '', driver_license: '', driver_contact: '' });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: '', model: '', license_plate: '', capacity: 50, config: '2x2', feature_wifi: false, feature_ac: false, feature_charging: false, feature_recliner: false, feature_toilet: false, insured: false, permit_number: '', status: 'Active', insurance: '' });
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(true);

  const load = async () => {
    const { data } = await getCompanyBuses();
    setBuses(data || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { (async () => { try { const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole') || 'admin'; const { data } = await getCompanySettings(); setCanEdit(!!(data?.rbac?.[role]?.edit)); } catch { setCanEdit(true); } })(); }, []);
  useEffect(() => { (async () => { const { data } = await getDrivers(); setDrivers(data || []); })(); }, []);

  const filtered = buses.filter(b => (b.license_plate || '').toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setError(''); setForm({ name: '', type: '', model: '', license_plate: '', capacity: 50, config: '2x2', feature_wifi: false, feature_ac: false, feature_charging: false, feature_recliner: false, feature_toilet: false, insured: false, permit_number: '', status: 'Active', insurance: '' }); setDialogOpen(true); };
  const openEdit = (b) => { setEditing(b); setError(''); setForm({ name: b.name||'', type: b.type||'', model: b.model||'', license_plate: b.license_plate || '', capacity: b.capacity || 50, status: b.status || 'Active', config: b.config || '2x2', feature_wifi: !!b.feature_wifi, feature_ac: !!b.feature_ac, feature_charging: !!b.feature_charging, feature_recliner: !!b.feature_recliner, feature_toilet: !!b.feature_toilet, insured: !!b.insured, permit_number: b.permit_number||'', insurance: b.insurance || '' }); setDialogOpen(true); };
  const openActions = (b) => {
    setEditing(b);
    setActionsForm({
      make: b.make || '',
      year_of_manufacture: b.year_of_manufacture || '',
      ownership_company: b.ownership_company || '',
      insurance_details: b.insurance_details || b.insurance || '',
      permit_number: b.permit_number || '',
      roadworthiness_certificate_no: b.roadworthiness_certificate_no || '',
      roadworthiness_issued_at: (b.roadworthiness_issued_at || '').toString().slice(0,16),
      roadworthiness_expires_at: (b.roadworthiness_expires_at || '').toString().slice(0,16),
      health_status: b.health_status || '',
      status_notes: b.status_notes || '',
    });
    setActionsOpen(true);
  };

  const saveActions = async () => {
    const payload = {
      make: actionsForm.make || null,
      year_of_manufacture: actionsForm.year_of_manufacture ? Number(actionsForm.year_of_manufacture) : null,
      ownership_company: actionsForm.ownership_company || null,
      insurance_details: actionsForm.insurance_details || null,
      permit_number: actionsForm.permit_number || null,
      roadworthiness_certificate_no: actionsForm.roadworthiness_certificate_no || null,
      roadworthiness_issued_at: actionsForm.roadworthiness_issued_at ? new Date(actionsForm.roadworthiness_issued_at).toISOString() : null,
      roadworthiness_expires_at: actionsForm.roadworthiness_expires_at ? new Date(actionsForm.roadworthiness_expires_at).toISOString() : null,
      health_status: actionsForm.health_status || null,
      status_notes: actionsForm.status_notes || null,
      status_checked_at: new Date().toISOString(),
    };
    await updateBus(editing.bus_id, payload);
    setActionsOpen(false);
    load();
  };
  const save = async () => {
    setError('');
    const payload = { name: form.name, type: form.type, model: form.model, license_plate: form.license_plate, capacity: Number(form.capacity || 0), status: form.status, config: form.config, feature_wifi: !!form.feature_wifi, feature_ac: !!form.feature_ac, feature_charging: !!form.feature_charging, feature_recliner: !!form.feature_recliner, feature_toilet: !!form.feature_toilet, insured: !!form.insured, permit_number: form.permit_number || null, insurance: form.insurance };
    const res = editing ? await updateBus(editing.bus_id, payload) : await createBus(payload);
    if (res?.error) {
      const msg = res.error.message || String(res.error);
      if (/model|schema cache/i.test(msg)) {
        // Retry without model field as a fallback
        const { model, ...fallback } = payload;
        const retry = editing ? await updateBus(editing.bus_id, fallback) : await createBus(fallback);
        if (retry?.error) { setError(retry.error.message || String(retry.error)); return; }
      } else {
        setError(msg);
        return;
      }
    }
    setDialogOpen(false);
    setEditing(null);
    setForm({ name: '', type: '', model: '', license_plate: '', capacity: 50, config: '2x2', features: { wifi: false, ac: false, charging: false, recliner: false, toilet: false }, insured: false, permit_number: '', status: 'Active', insurance: '', maintenance_logs: [] });
    load();
  };

  return (
    <>
      <TextField label="Search Buses" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      {canEdit && <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={openNew}>Add Bus</Button>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Bus Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Model</TableCell>
            <TableCell>License Plate</TableCell>
            <TableCell>Capacity</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Health</TableCell>
            <TableCell>Last Check</TableCell>
            <TableCell>Config</TableCell>
            <TableCell>Insurance</TableCell>
            <TableCell>Insured</TableCell>
            <TableCell>Permit</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => (
            <TableRow key={b.bus_id}>
              <TableCell>{b.name || '-'}</TableCell>
              <TableCell>{b.type || '-'}</TableCell>
              <TableCell>{b.model || '-'}</TableCell>
              <TableCell>{b.license_plate}</TableCell>
              <TableCell>{b.capacity}</TableCell>
              <TableCell>{b.status}</TableCell>
              <TableCell>{b.health_status || '-'}</TableCell>
              <TableCell>{b.status_checked_at ? new Date(b.status_checked_at).toLocaleString() : '-'}</TableCell>
              <TableCell>{b.config || '-'}</TableCell>
              <TableCell>{b.insurance || '-'}</TableCell>
              <TableCell>{b.insured ? 'Yes' : 'No'}</TableCell>
              <TableCell>{b.permit_number || '-'}</TableCell>
              <TableCell>
                {canEdit && <Button size="small" variant="outlined" onClick={() => openActions(b)}>Actions</Button>}
                {canEdit && <IconButton onClick={() => openEdit(b)}><EditIcon /></IconButton>}
                {canEdit && <IconButton onClick={async () => { await deleteBus(b.bus_id); load(); }}><DeleteIcon /></IconButton>}
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
          {error ? <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert> : null}
          <TextField label="Bus Name / Identifier" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mt: 1 }} />
          <Select fullWidth value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} displayEmpty sx={{ mt: 2 }}>
            <MenuItem value="">Select Bus Type...</MenuItem>
            <MenuItem value="Luxury">Luxury</MenuItem>
            <MenuItem value="Semi-Luxury">Semi-Luxury</MenuItem>
            <MenuItem value="Economy">Economy</MenuItem>
          </Select>
          <TextField label="Bus Model (optional)" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Number Plate" value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Seating Capacity" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <Select fullWidth value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
            <MenuItem value="Retired">Retired</MenuItem>
          </Select>
          <Select fullWidth value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="2x2">2x2</MenuItem>
            <MenuItem value="2x3">2x3</MenuItem>
          </Select>
          <FormControlLabel control={<Checkbox checked={!!form.feature_wifi} onChange={e => setForm(f => ({ ...f, feature_wifi: e.target.checked }))} />} label="WiFi" />
          <FormControlLabel control={<Checkbox checked={!!form.feature_ac} onChange={e => setForm(f => ({ ...f, feature_ac: e.target.checked }))} />} label="AC" />
          <FormControlLabel control={<Checkbox checked={!!form.feature_charging} onChange={e => setForm(f => ({ ...f, feature_charging: e.target.checked }))} />} label="Charging Ports" />
          <FormControlLabel control={<Checkbox checked={!!form.feature_recliner} onChange={e => setForm(f => ({ ...f, feature_recliner: e.target.checked }))} />} label="Recliner Seats" />
          <FormControlLabel control={<Checkbox checked={!!form.feature_toilet} onChange={e => setForm(f => ({ ...f, feature_toilet: e.target.checked }))} />} label="Toilet" />
          <FormControlLabel control={<Checkbox checked={!!form.insured} onChange={e => setForm(f => ({ ...f, insured: e.target.checked }))} />} label="Insured" />
          <TextField label="Permit Number (optional)" value={form.permit_number} onChange={e => setForm(f => ({ ...f, permit_number: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Insurance" value={form.insurance} onChange={e => setForm(f => ({ ...f, insurance: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Maintenance Logs (JSON)" value={JSON.stringify(form.maintenance_logs)} onChange={e => { try { setForm(f => ({ ...f, maintenance_logs: JSON.parse(e.target.value || '[]') })); } catch {} }} fullWidth sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          {canEdit && <Button variant="contained" onClick={save}>Save</Button>}
        </DialogActions>
      </Dialog>

      <Dialog open={actionsOpen} onClose={() => setActionsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bus Details & Operations</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Divider>Bus Details</Divider>
            <TextField label="Bus ID/Registration" value={editing?.bus_id || ''} fullWidth disabled />
            <TextField label="License plate number" value={editing?.license_plate || ''} fullWidth disabled />
            <TextField label="Bus model" value={editing?.model || ''} fullWidth disabled />
            <TextField label="Make" value={actionsForm.make} onChange={e => setActionsForm(f => ({ ...f, make: e.target.value }))} fullWidth />
            <TextField label="Year of manufacture" type="number" value={actionsForm.year_of_manufacture} onChange={e => setActionsForm(f => ({ ...f, year_of_manufacture: e.target.value }))} fullWidth />
            <TextField label="Seating capacity" value={editing?.capacity || ''} fullWidth disabled />
            <TextField label="Bus type" value={editing?.type || ''} fullWidth disabled />
            <TextField label="Features" value={Object.keys(editing?.features || {}).filter(k => editing?.features?.[k]).join(', ')} fullWidth disabled />

            <Divider>Operational Details</Divider>
            {/* Assigned routes skipped (no JSON denorm) */}

            <Divider>Health & Status</Divider>
            <Select fullWidth value={actionsForm.health_status} onChange={e => setActionsForm(f => ({ ...f, health_status: e.target.value }))} displayEmpty>
              <MenuItem value="">Health (optional)</MenuItem>
              <MenuItem value="FIT">FIT</MenuItem>
              <MenuItem value="OK">OK</MenuItem>
              <MenuItem value="UNWELL">UNWELL</MenuItem>
            </Select>
            <TextField label="Status notes" value={actionsForm.status_notes} onChange={e => setActionsForm(f => ({ ...f, status_notes: e.target.value }))} fullWidth />
            <TextField label="Last check" value={editing?.status_checked_at ? new Date(editing.status_checked_at).toLocaleString() : ''} fullWidth disabled />

            <Divider>Ownership & Compliance</Divider>
            <TextField label="Owner/company name" value={actionsForm.ownership_company} onChange={e => setActionsForm(f => ({ ...f, ownership_company: e.target.value }))} fullWidth />
            <TextField label="Insurance details" value={actionsForm.insurance_details} onChange={e => setActionsForm(f => ({ ...f, insurance_details: e.target.value }))} fullWidth />
            <TextField label="Roadworthiness Certificate #" value={actionsForm.roadworthiness_certificate_no} onChange={e => setActionsForm(f => ({ ...f, roadworthiness_certificate_no: e.target.value }))} fullWidth />
            <TextField label="Roadworthiness Issued At" type="datetime-local" value={actionsForm.roadworthiness_issued_at} onChange={e => setActionsForm(f => ({ ...f, roadworthiness_issued_at: e.target.value }))} fullWidth />
            <TextField label="Roadworthiness Expires At" type="datetime-local" value={actionsForm.roadworthiness_expires_at} onChange={e => setActionsForm(f => ({ ...f, roadworthiness_expires_at: e.target.value }))} fullWidth />
            <TextField label="Permit/license details" value={actionsForm.permit_number} onChange={e => setActionsForm(f => ({ ...f, permit_number: e.target.value }))} fullWidth />

            <Divider>Driver Assignment</Divider>
            <Select fullWidth value={assign.driver_id} onChange={e => setAssign(a => ({ ...a, driver_id: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Driver...</MenuItem>
              {drivers.map(d => <MenuItem key={d.driver_id} value={d.driver_id}>{d.name}</MenuItem>)}
            </Select>
            <TextField label="Driver license number" value={assign.driver_license} onChange={e => setAssign(a => ({ ...a, driver_license: e.target.value }))} fullWidth />
            <TextField label="Driver contact" value={assign.driver_contact} onChange={e => setAssign(a => ({ ...a, driver_contact: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionsOpen(false)}>Close</Button>
          {canEdit && <Button variant="contained" onClick={async () => {
            await saveActions();
            if (assign.driver_id) {
              await window.supabase.from('drivers').update({ assigned_bus_id: editing.bus_id, license_number: assign.driver_license || null }).eq('driver_id', assign.driver_id);
            }
          }}>Save</Button>}
        </DialogActions>
      </Dialog>
    </>
  );
}
