import React, { useEffect, useState } from 'react';
import { Grid, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem } from '@mui/material';
import DashboardCard, { StatsCard, QuickActionCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import CommandCenterMap from '../../companyAdmin/tabs/CommandCenterMap';
import { supabase } from '../../../supabase/client';
import { upsertTripSchedule, assignBusToRoute } from '../../../supabase/api';

export default function CommandCenterTab() {
  const [kpis, setKpis] = useState({ active: 0, delayed: 0, cancelled: 0, inDepot: 0, inOperation: 0, maintenance: 0, boarded: 0, noShows: 0, fuelAlerts: 0, partsAlerts: 0 });
  const [alerts, setAlerts] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ trip_id: '', bus_id: '', driver_id: '', route_id: '', km_to_service: '', notes: '' });
  const [tripsUpcoming, setTripsUpcoming] = useState([]);
  const [shift, setShift] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');

  const loadKPIs = async () => {
    const start = new Date(); start.setHours(0,0,0,0); const end = new Date(); end.setHours(23,59,59,999);
    const [trips, buses, bookings, inv] = await Promise.all([
      supabase.from('trips_with_details').select('trip_id, status, departure_time').eq('company_id', companyId).gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString()),
      supabase.from('buses').select('status').eq('company_id', companyId),
      supabase.from('bookings').select('status').eq('company_id', companyId).gte('booking_date', start.toISOString()).lte('booking_date', end.toISOString()),
      supabase.from('inventory').select('item, quantity, min_threshold').eq('company_id', companyId).limit(200),
    ]);
    const t = trips.data || []; const b = buses.data || []; const bk = bookings.data || []; const iv = inv.data || [];
    const delayed = t.filter(x => (x.status||'').toLowerCase() === 'delayed').length;
    const cancelled = t.filter(x => (x.status||'').toLowerCase() === 'cancelled').length;
    const active = t.filter(x => (x.status||'').toLowerCase() === 'inprogress' || (x.status||'').toLowerCase() === 'boarding').length;
    const inDepot = b.filter(x => (x.status||'').toLowerCase() === 'idle' || (x.status||'').toLowerCase() === 'in_depot').length;
    const maintenance = b.filter(x => (x.status||'').toLowerCase().includes('maintenance')).length;
    const inOperation = Math.max(0, b.length - inDepot);
    const boarded = bk.filter(x => x.status === 'CheckedIn').length;
    const noShows = Math.max(0, (bk||[]).length - boarded);
    const partsAlerts = iv.filter(x => Number(x.quantity||0) <= Number(x.min_threshold||0)).length;
    setKpis({ active, delayed, cancelled, inDepot, inOperation, maintenance, boarded, noShows, fuelAlerts: 0, partsAlerts });
  };

  const loadShift = async () => {
    const { data } = await supabase.from('staff_tasks').select('role, staff_name, status').eq('company_id', companyId).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
    setShift(data || []);
  };

  const loadAlerts = async () => {
    const list = [];
    if (kpis.delayed > 0) list.push({ created_at: new Date().toISOString(), type: 'delay', message: `${kpis.delayed} delayed trips` });
    if (kpis.cancelled > 0) list.push({ created_at: new Date().toISOString(), type: 'cancel', message: `${kpis.cancelled} cancellations` });
    if (kpis.partsAlerts > 0) list.push({ created_at: new Date().toISOString(), type: 'inventory', message: `${kpis.partsAlerts} low inventory items` });
    setAlerts(list);
  };

  useEffect(() => { (async () => {
    loadKPIs(); loadShift();
    const today = new Date(); today.setHours(0,0,0,0);
    const [{ data: b }, { data: d }, { data: r }, { data: t }] = await Promise.all([
      supabase.from('buses').select('bus_id, license_plate, mileage, status').eq('company_id', companyId),
      supabase.from('users').select('user_id, name, role, on_duty').eq('company_id', companyId).eq('role', 'driver').eq('on_duty', true),
      supabase.from('routes').select('route_id, origin, destination').eq('company_id', companyId),
      supabase.from('trips_with_details').select('trip_id, route_name, departure_time, status').eq('company_id', companyId).gte('departure_time', today.toISOString()).order('departure_time', { ascending: true }),
    ]);
    setBuses(b||[]); setDrivers(d||[]); setRoutes(r||[]); setTripsUpcoming(t||[]);
  })(); }, [companyId]);
  useEffect(() => { loadAlerts(); }, [kpis]);

  const actions = [
    { label: 'Assign Bus', icon: 'bus', onClick: () => { setForm({ trip_id: '', bus_id: '', driver_id: '', route_id: '', km_to_service: '', notes: '' }); setAssignOpen(true); } },
    { label: 'Reassign Driver', icon: 'driver', onClick: () => { setForm({ trip_id: '', bus_id: '', driver_id: '', route_id: '', km_to_service: '', notes: '' }); setReassignOpen(true); } },
    { label: 'Schedule Maintenance', icon: 'wrench', onClick: () => { setForm({ trip_id: '', bus_id: '', driver_id: '', route_id: '', km_to_service: '', notes: '' }); setMaintOpen(true); } },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DashboardCard title="Live Depot Map" variant="elevated">
          <CommandCenterMap />
        </DashboardCard>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Active Trips" value={kpis.active} icon="trips" color="info" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Delayed" value={kpis.delayed} icon="warning" color="warning" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Cancelled" value={kpis.cancelled} icon="error" color="error" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="In Operation" value={kpis.inOperation} icon="bus" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="In Depot" value={kpis.inDepot} icon="home" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Under Maintenance" value={kpis.maintenance} icon="wrench" color="warning" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Boarded Today" value={kpis.boarded} icon="check" color="success" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="No-shows" value={kpis.noShows} icon="close" color="error" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Parts Alerts" value={kpis.partsAlerts} icon="inventory" color="warning" /></Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4}>
        <QuickActionCard title="Quick Actions" actions={actions} />
      </Grid>
      {/* Alerts & Notifications removed */}

      <Grid item xs={12}>
        <DashboardCard title="Shift Summary" variant="outlined">
          <DataTable
            data={shift}
            columns={[
              { field: 'staff_name', headerName: 'Staff' },
              { field: 'role', headerName: 'Role' },
              { field: 'status', headerName: 'Status' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>

      <Grid item xs={12}>
        <DashboardCard title="Today's Trips (Delay Flags)" variant="outlined">
          <DataTable
            data={(() => {
              try { return JSON.parse(JSON.stringify(kpis && kpis.active != null ? [] : [])); } catch { return []; }
            })()} columns={[{ field: 'trip_id', headerName: 'Trip' }, { field: 'departure_time', headerName: 'Departure', type: 'date' }, { field: 'status', headerName: 'Status' }]}
            emptyMessage="Flags shown in Alerts above"
          />
        </DashboardCard>
      </Grid>

      <Dialog open={assignOpen} onClose={()=>setAssignOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign Bus</DialogTitle>
        <DialogContent>
          <Select fullWidth displayEmpty size="small" value={form.trip_id} onChange={e=>setForm(f=>({ ...f, trip_id: e.target.value }))} sx={{ mt: 1 }}>
            <MenuItem value="">Select Trip (today & upcoming)...</MenuItem>
            {(tripsUpcoming||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.trip_id} · {t.route_name} · {new Date(t.departure_time).toLocaleString()}</MenuItem>)}
          </Select>
          <Select fullWidth displayEmpty size="small" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="">Select Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate} · {b.status}</MenuItem>)}
          </Select>
          <Select fullWidth displayEmpty size="small" value={form.route_id} onChange={e=>setForm(f=>({ ...f, route_id: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="">Select Route...</MenuItem>
            {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} → {r.destination}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.trip_id || !form.bus_id) return; try { await assignBusToRoute(form.bus_id, form.route_id || null); await upsertTripSchedule(form.trip_id, { bus_id: form.bus_id, route_id: form.route_id || null }); alert('Assigned'); setAssignOpen(false); } catch { alert('Failed'); } }}>Assign</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reassignOpen} onClose={()=>setReassignOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reassign Driver</DialogTitle>
        <DialogContent>
          <Select fullWidth displayEmpty size="small" value={form.trip_id} onChange={e=>setForm(f=>({ ...f, trip_id: e.target.value }))} sx={{ mt: 1 }}>
            <MenuItem value="">Select Trip (today & upcoming)...</MenuItem>
            {(tripsUpcoming||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.trip_id} · {t.route_name} · {new Date(t.departure_time).toLocaleString()}</MenuItem>)}
          </Select>
          <Select fullWidth displayEmpty size="small" value={form.driver_id} onChange={e=>setForm(f=>({ ...f, driver_id: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="">Select Driver (on duty)...</MenuItem>
            {(drivers||[]).map(d => <MenuItem key={d.user_id} value={d.user_id}>{d.name}</MenuItem>)}
          </Select>
          <Select fullWidth displayEmpty size="small" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="">Select Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate}</MenuItem>)}
          </Select>
          <Select fullWidth displayEmpty size="small" value={form.route_id} onChange={e=>setForm(f=>({ ...f, route_id: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="">Select Route...</MenuItem>
            {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} → {r.destination}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setReassignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.trip_id || !form.driver_id) return; try { await upsertTripSchedule(form.trip_id, { driver_id: form.driver_id, bus_id: form.bus_id || null, route_id: form.route_id || null }); alert('Updated'); setReassignOpen(false); } catch { alert('Failed'); } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={maintOpen} onClose={()=>setMaintOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Select fullWidth displayEmpty size="small" value={form.bus_id} onChange={e=>setForm(f=>({ ...f, bus_id: e.target.value }))} sx={{ mt: 1 }}>
            <MenuItem value="">Select Bus...</MenuItem>
            {(buses||[]).map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{b.license_plate} · mileage {b.mileage||0}</MenuItem>)}
          </Select>
          <TextField fullWidth size="small" label="Flagged Issues" value={form.notes} onChange={e=>setForm(f=>({ ...f, notes: e.target.value }))} sx={{ mt: 2 }} />
          <TextField fullWidth size="small" label="KM before next service" value={form.km_to_service} onChange={e=>setForm(f=>({ ...f, km_to_service: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setMaintOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!form.bus_id) return; try { await supabase.from('maintenance_tasks').insert([{ company_id: companyId, bus_id: form.bus_id, title: 'Scheduled service', priority: 'medium', status: 'scheduled', notes: form.notes||null, km_to_service: form.km_to_service?Number(form.km_to_service):null }]); alert('Maintenance scheduled'); setMaintOpen(false); } catch { alert('Failed'); } }}>Schedule</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
