import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Paper, Stack, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem } from '@mui/material';
import DataTable from '../../common/DataTable';
import { getCompanySettings, getCompanyRoutes, getCompanyBuses, getDrivers, getRouteSchedulesTable, upsertRouteScheduleTable, deleteRouteScheduleById } from '../../../supabase/api';

export default function TripSchedulingTab() {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRoute, setFilterRoute] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ route_id: '', bus_id: '', driver_id: '', departure_time: '', arrival_time: '', days_of_week: '' });
  const [canEdit, setCanEdit] = useState(true);

  const routeLabel = (rid) => {
    const r = routes.find(x => x.route_id === rid);
    return r ? `${r.origin} → ${r.destination}` : rid || '-';
    };

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: rs }, { data: rb }, { data: dr }, { data: schedRes }] = await Promise.all([
        getCompanyRoutes(),
        getCompanyBuses(),
        getDrivers(),
        getRouteSchedulesTable(),
      ]);
      setRoutes(rs || []);
      setBuses(rb || []);
      setDrivers(dr || []);
      setSchedules(schedRes || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); (async () => { try { const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole') || 'admin'; const { data } = await getCompanySettings(); setCanEdit(!!(data?.rbac?.[role]?.edit)); } catch { setCanEdit(true); } })(); }, []);

  const filtered = useMemo(() => {
    return (schedules || []).filter(s => (
      (filterRoute ? s.route_id === filterRoute : true)
      && (filterDateStart ? (s.departure_time || '').slice(0,10) >= filterDateStart : true)
      && (filterDateEnd ? (s.departure_time || '').slice(0,10) <= filterDateEnd : true)
    ));
  }, [schedules, filterRoute, filterDateStart, filterDateEnd]);

  const openNew = () => { setEditing(null); setForm({ route_id: '', bus_id: '', driver_id: '', departure_time: '', arrival_time: '', days_of_week: '' }); setDialogOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ route_id: row.route_id || '', bus_id: row.bus_id || '', driver_id: row.driver_id || '', departure_time: row.departure_time || '', arrival_time: row.arrival_time || '', days_of_week: row.days_of_week || '' }); setDialogOpen(true); };

  const save = async () => {
    const payload = { ...form, schedule_id: editing?.schedule_id || undefined };
    try { await upsertRouteScheduleTable(payload); } catch {}
    setDialogOpen(false);
    load();
  };

  const del = async (row) => {
    if (!row?.schedule_id) return;
    try { await deleteRouteScheduleById(row.schedule_id); } catch {}
    load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Trip Scheduling</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Select size="small" value={filterRoute} onChange={e => setFilterRoute(e.target.value)} displayEmpty sx={{ minWidth: 220 }}>
            <MenuItem value="">All Routes</MenuItem>
            {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} → {r.destination}</MenuItem>)}
          </Select>
          <TextField size="small" label="Start" type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="End" type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
          {canEdit && <Button variant="contained" onClick={openNew} sx={{ ml: 'auto' }}>Add Schedule</Button>}
        </Stack>
      </Paper>

      <DataTable
        data={filtered}
        loading={loading}
        columns={[
          { field: 'route_id', headerName: 'Route', renderCell: ({ value }) => routeLabel(value) },
          { field: 'bus_id', headerName: 'Bus' },
          { field: 'driver_id', headerName: 'Driver' },
          { field: 'departure_time', headerName: 'Departure' },
          { field: 'arrival_time', headerName: 'Arrival' },
          { field: 'days_of_week', headerName: 'Days' },
        ]}
        rowActions={canEdit ? [
          { label: 'Edit', onClick: ({ row }) => openEdit(row) },
          { label: 'Delete', onClick: ({ row }) => del(row) },
        ] : []}
        pagination
        searchable
        emptyMessage="No schedules found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Select value={form.route_id} onChange={e => setForm(f => ({ ...f, route_id: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Route...</MenuItem>
              {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} → {r.destination}</MenuItem>)}
            </Select>
            <Select value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Bus...</MenuItem>
              {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
            </Select>
            <Select value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Driver...</MenuItem>
              {(drivers||[]).map(d => <MenuItem key={d.driver_id} value={d.driver_id}>{d.name}</MenuItem>)}
            </Select>
            <TextField label="Departure" type="datetime-local" value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Arrival" type="datetime-local" value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Days of Week (e.g. Mon,Wed,Fri)" value={form.days_of_week} onChange={e => setForm(f => ({ ...f, days_of_week: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          {canEdit && <Button variant="contained" onClick={save}>Save</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
