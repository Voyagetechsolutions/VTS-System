import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, Stack, Divider } from '@mui/material';
import { getCompanyRoutes, createRoute, updateRoute, deleteRoute, getCountries, getCities, getRouteStopsTable, upsertRouteStopsTable, deleteRouteStopById, getRouteSchedulesTable, upsertRouteScheduleTable, deleteRouteScheduleById, getCompanyBuses, getDrivers, assignBusToRoute, assignDriverToRoute } from '../../../supabase/api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function RoutesTab() {
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ country_id: '', origin_city_id: '', destination_city_id: '', stops: [], departure_times: [], arrival_times: [], frequency: 'Daily', price: '' });
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [actionsForm, setActionsForm] = useState({ route_code: '', status: 'active', distance_km: '', estimated_travel_time: '', road_type: '', currency: 'ZAR', permit_number: '', discount_amount: '', discount_percent: '' });
  const [stops, setStops] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [busOptions, setBusOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [assign, setAssign] = useState({ bus_id: '', driver_id: '' });

  useEffect(() => { getCompanyRoutes().then(({ data }) => setRoutes(data || [])); getCountries().then(res => setCountries(res.data || [])); }, []);
  useEffect(() => { if (form.country_id) getCities(form.country_id).then(res => setCities(res.data || [])); }, [form.country_id]);

  const filtered = routes.filter(r => (r.origin || '').toLowerCase().includes(search.toLowerCase()) || (r.destination || '').toLowerCase().includes(search.toLowerCase()))

  const openNew = () => { setEditing(null); setForm({ country_id: '', origin_city_id: '', destination_city_id: '', stops: [], departure_times: [], arrival_times: [], frequency: 'Daily', price: '' }); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ country_id: '', origin_city_id: '', destination_city_id: '', stops: r.stops || [], departure_times: r.departure_times || [], arrival_times: r.arrival_times || [], frequency: r.frequency || 'Daily', price: r.price || '' }); setDialogOpen(true); };
  const openActions = async (r) => {
    setEditing(r);
    setActionsForm({ route_code: r.route_code || '', status: r.status || 'active', distance_km: r.distance_km || '', estimated_travel_time: r.estimated_travel_time || '', road_type: r.road_type || '', currency: r.currency || 'ZAR', permit_number: r.permit_number || '', discount_amount: r.discount_amount || '', discount_percent: r.discount_percent || '' });
    const [st, sc, buses, drivers] = await Promise.all([
      getRouteStopsTable(r.route_id),
      getRouteSchedulesTable(r.route_id),
      getCompanyBuses(),
      getDrivers(),
    ]);
    setStops(st.data || []);
    setSchedules(sc.data || []);
    setBusOptions(buses.data || []);
    setDriverOptions(drivers.data || []);
    setAssign({ bus_id: '', driver_id: '' });
    setActionsOpen(true);
  };

  const save = async () => {
    const originName = (cities || []).find(c => c.id === form.origin_city_id)?.name || '';
    const destName = (cities || []).find(c => c.id === form.destination_city_id)?.name || '';
    const payload = {
      country: (countries || []).find(c => c.id === form.country_id)?.name || null,
      origin: originName,
      destination: destName,
      stops: form.stops,
      departure_times: form.departure_times,
      arrival_times: form.arrival_times,
      frequency: form.frequency,
      price: form.price === '' ? null : Number(form.price)
    };
    if (editing) { await updateRoute(editing.route_id, payload); } else { await createRoute(payload); }
    setDialogOpen(false);
    setEditing(null);
    setForm({ country_id: '', origin_city_id: '', destination_city_id: '', stops: [], departure_times: [], arrival_times: [], frequency: 'Daily', price: '' });
    getCompanyRoutes().then(({ data }) => setRoutes(data || []));
  };

  const saveActions = async () => {
    const payload = {
      route_code: actionsForm.route_code || null,
      status: actionsForm.status || null,
      distance_km: actionsForm.distance_km ? Number(actionsForm.distance_km) : null,
      estimated_travel_time: actionsForm.estimated_travel_time || null,
      road_type: actionsForm.road_type || null,
      currency: actionsForm.currency || null,
      permit_number: actionsForm.permit_number || null,
      discount_amount: actionsForm.discount_amount ? Number(actionsForm.discount_amount) : null,
      discount_percent: actionsForm.discount_percent ? Number(actionsForm.discount_percent) : null,
    };
    await updateRoute(editing.route_id, payload);
    await upsertRouteStopsTable(editing.route_id, stops.map((s, i) => ({ id: s.id, sort_order: i + 1, name: s.name, city_id: s.city_id || null, eta: s.eta || null, etd: s.etd || null })));
    for (const sc of schedules) {
      await upsertRouteScheduleTable(editing.route_id, sc);
    }
    // Update summary fields for list display (departure_times/arrival_times/frequency)
    try {
      const dep = schedules.map(s => s.departure_time).filter(Boolean);
      const arr = schedules.map(s => s.arrival_time).filter(Boolean);
      const freqs = Array.from(new Set(schedules.map(s => s.frequency).filter(Boolean)));
      await updateRoute(editing.route_id, { departure_times: dep, arrival_times: arr, frequency: freqs.length === 1 ? freqs[0] : 'Custom' });
    } catch {}
    if (assign.bus_id) await assignBusToRoute(assign.bus_id, editing.route_id);
    if (assign.driver_id) await assignDriverToRoute(assign.driver_id, editing.route_id);
    setActionsOpen(false);
    getCompanyRoutes().then(({ data }) => setRoutes(data || []));
  };

  return (
    <>
      <TextField label="Search Routes" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={openNew}>Add Route</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Pick up</TableCell>
            <TableCell>Drop off</TableCell>
            <TableCell>Departure Times</TableCell>
            <TableCell>Arrival Times</TableCell>
            <TableCell>Frequency</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r) => (
            <TableRow key={r.route_id}>
              <TableCell>{r.origin}</TableCell>
              <TableCell>{r.destination}</TableCell>
              <TableCell>{Array.isArray(r.departure_times) ? r.departure_times.join(', ') : '-'}</TableCell>
              <TableCell>{Array.isArray(r.arrival_times) ? r.arrival_times.join(', ') : '-'}</TableCell>
              <TableCell>{r.frequency || '-'}</TableCell>
              <TableCell>{r.price != null ? Number(r.price) : '-'}</TableCell>
              <TableCell>
                <Button size="small" variant="outlined" onClick={() => openActions(r)}>Actions</Button>
                <IconButton onClick={() => openEdit(r)}><EditIcon /></IconButton>
                <IconButton onClick={async () => { await deleteRoute(r.route_id); try { await window.supabase.from('activity_log').insert([{ company_id: window.companyId, type: 'route_delete', message: JSON.stringify({ route_id: r.route_id, by: window.userId }) }]); } catch {} getCompanyRoutes().then(({ data }) => setRoutes(data || [])); }}><DeleteIcon /></IconButton>
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
        <DialogTitle>{editing ? 'Edit Route' : 'Add Route'}</DialogTitle>
        <DialogContent>
          <Select fullWidth value={form.country_id} onChange={e => setForm(f => ({ ...f, country_id: e.target.value, origin_city_id: '', destination_city_id: '' }))} displayEmpty sx={{ mt: 1 }}>
            <MenuItem value="">Select Country...</MenuItem>
            {(countries || []).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
          <Select fullWidth value={form.origin_city_id} onChange={e => setForm(f => ({ ...f, origin_city_id: e.target.value }))} displayEmpty sx={{ mt: 2 }}>
            <MenuItem value="">Select Origin City...</MenuItem>
            {(cities || []).map(city => <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>)}
          </Select>
          <Select fullWidth value={form.destination_city_id} onChange={e => setForm(f => ({ ...f, destination_city_id: e.target.value }))} displayEmpty sx={{ mt: 2 }}>
            <MenuItem value="">Select Destination City...</MenuItem>
            {(cities || []).map(city => <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>)}
          </Select>
          <TextField label="Intermediate Stops (comma separated)" value={Array.isArray(form.stops) ? form.stops.map(s => s.name || s).join(', ') : ''} onChange={e => setForm(f => ({ ...f, stops: (e.target.value || '').split(',').map(s => ({ name: s.trim() })).filter(x => x.name) }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Departure Times (comma separated HH:MM)" value={(form.departure_times || []).join(', ')} onChange={e => setForm(f => ({ ...f, departure_times: (e.target.value || '').split(',').map(s => s.trim()).filter(Boolean) }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Arrival Times (comma separated HH:MM)" value={(form.arrival_times || []).join(', ')} onChange={e => setForm(f => ({ ...f, arrival_times: (e.target.value || '').split(',').map(s => s.trim()).filter(Boolean) }))} fullWidth sx={{ mt: 2 }} />
          <Select fullWidth value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="Daily">Daily</MenuItem>
            <MenuItem value="Weekdays">Weekdays</MenuItem>
            <MenuItem value="Custom">Custom</MenuItem>
          </Select>
          <TextField label="Ticket Price (per seat)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} fullWidth sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={actionsOpen} onClose={() => setActionsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Route & Schedule Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Divider>Route Identification</Divider>
            <TextField label="Route ID" value={editing?.route_id || ''} fullWidth disabled />
            <TextField label="Route name/number" value={actionsForm.route_code} onChange={e => setActionsForm(f => ({ ...f, route_code: e.target.value }))} fullWidth />
            <TextField label="Status" value={actionsForm.status} onChange={e => setActionsForm(f => ({ ...f, status: e.target.value }))} fullWidth />

            <Divider>Start & End Points</Divider>
            <TextField label="Origin" value={editing?.origin || ''} fullWidth disabled />
            <TextField label="Destination" value={editing?.destination || ''} fullWidth disabled />

            <Divider>Stopovers / Waypoints</Divider>
            {stops.map((s, idx) => (
              <Stack direction="row" spacing={1} key={s.id || idx}>
                <TextField label={`Stop ${idx + 1}`} value={s.name || ''} onChange={e => setStops(arr => arr.map((x,i)=> i===idx?{...x,name:e.target.value}:x))} fullWidth />
                <TextField label="ETA" type="time" value={s.eta || ''} onChange={e => setStops(arr => arr.map((x,i)=> i===idx?{...x,eta:e.target.value}:x))} />
                <TextField label="ETD" type="time" value={s.etd || ''} onChange={e => setStops(arr => arr.map((x,i)=> i===idx?{...x,etd:e.target.value}:x))} />
                <Button onClick={() => setStops(arr => arr.filter((_,i)=>i!==idx))}>Remove</Button>
              </Stack>
            ))}
            <Button onClick={() => setStops(arr => [...arr, { name: '', eta: '', etd: '' }])}>Add Stop</Button>

            <Divider>Distance & Duration</Divider>
            <TextField label="Total distance (km)" type="number" value={actionsForm.distance_km} onChange={e => setActionsForm(f => ({ ...f, distance_km: e.target.value }))} fullWidth />
            <TextField label="Estimated travel time (e.g., 13:00:00)" value={actionsForm.estimated_travel_time} onChange={e => setActionsForm(f => ({ ...f, estimated_travel_time: e.target.value }))} fullWidth />
            <TextField label="Road type" value={actionsForm.road_type} onChange={e => setActionsForm(f => ({ ...f, road_type: e.target.value }))} fullWidth />

            <Divider>Schedule</Divider>
            {schedules.map((sc, idx) => (
              <Stack direction="row" spacing={1} key={sc.id || idx}>
                <Select value={sc.frequency || ''} onChange={e => setSchedules(arr => arr.map((x,i)=> i===idx?{...x,frequency:e.target.value}:x))}>
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Weekdays">Weekdays</MenuItem>
                  <MenuItem value="Custom">Custom</MenuItem>
                </Select>
                <TextField label="Departure" type="time" value={sc.departure_time || ''} onChange={e => setSchedules(arr => arr.map((x,i)=> i===idx?{...x,departure_time:e.target.value}:x))} />
                <TextField label="Arrival" type="time" value={sc.arrival_time || ''} onChange={e => setSchedules(arr => arr.map((x,i)=> i===idx?{...x,arrival_time:e.target.value}:x))} />
                <Button onClick={() => setSchedules(arr => arr.filter((_,i)=>i!==idx))}>Remove</Button>
              </Stack>
            ))}
            <Button onClick={() => setSchedules(arr => [...arr, { frequency: 'Daily', departure_time: '', arrival_time: '' }])}>Add Schedule</Button>

            <Divider>Fare Information</Divider>
            <TextField label="Base fare (per seat)" value={editing?.price != null ? Number(editing.price) : ''} fullWidth disabled />
            <TextField label="Currency" value={actionsForm.currency} onChange={e => setActionsForm(f => ({ ...f, currency: e.target.value }))} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Discount amount" type="number" value={actionsForm.discount_amount} onChange={e => setActionsForm(f => ({ ...f, discount_amount: e.target.value }))} fullWidth />
              <TextField label="Discount percent" type="number" value={actionsForm.discount_percent} onChange={e => setActionsForm(f => ({ ...f, discount_percent: e.target.value }))} fullWidth />
            </Stack>

            <Divider>Bus Assignment</Divider>
            <Select fullWidth value={assign.bus_id} onChange={e => setAssign(a => ({ ...a, bus_id: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Bus...</MenuItem>
              {busOptions.map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{`${b.license_plate} (${b.capacity})`}</MenuItem>)}
            </Select>

            <Divider>Driver/Staff Assignment</Divider>
            <Select fullWidth value={assign.driver_id} onChange={e => setAssign(a => ({ ...a, driver_id: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Driver...</MenuItem>
              {driverOptions.map(d => <MenuItem key={d.driver_id} value={d.driver_id}>{d.name}</MenuItem>)}
            </Select>

            <Divider>Compliance</Divider>
            <TextField label="Route permit/license" value={actionsForm.permit_number} onChange={e => setActionsForm(f => ({ ...f, permit_number: e.target.value }))} fullWidth />
            <TextField label="Cross-border docs" value={editing?.cross_border_docs || ''} fullWidth disabled />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveActions}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
