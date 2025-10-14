import React, { useEffect, useState } from 'react';
import { Grid, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from '@mui/material';
import DashboardCard, { StatsCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';
import { updateTripStatus, updateTripStatusWithReason, createIncident, computeDriverEarningsEstimate, recordDriverInspection } from '../../../supabase/api';

export default function OverviewTab() {
  const [trips, setTrips] = useState([]);
  const [kpis, setKpis] = useState({ passengers: 0, tripsCompleted: 0, onTime: 0, incidents: 0, fatigue: 'OK' });
  const [earn, setEarn] = useState({ estimate: 0, completedTrips: 0 });
  const userId = window.userId || localStorage.getItem('userId');
  const [qrOpen, setQrOpen] = useState(false);
  const [scanMode, setScanMode] = useState('start');
  const [scanTrip, setScanTrip] = useState(null);
  const [qrText, setQrText] = useState('');
  const [cameraLoaded, setCameraLoaded] = useState(false);

  const load = async () => {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const { data } = await supabase
      .from('trips_with_details')
      .select('trip_id, route_name, departure_time, arrival_time, bus_id, status, passenger_count, capacity, actual_departure_time, actual_arrival_time')
      .eq('driver_id', userId)
      .gte('departure_time', start.toISOString())
      .lte('departure_time', end.toISOString())
      .order('departure_time', { ascending: true });
    setTrips(data || []);

    // Trips completed today
    const completed = (data||[]).filter(t => (t.status||'').toLowerCase() === 'completed').length;

    // Passengers Today: checked-in / total booked across today's trips
    const tripIds = (data||[]).map(t => t.trip_id);
    let checkedIn = 0; let totalBooked = 0;
    if (tripIds.length > 0) {
      try {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('booking_id, status, trip_id')
          .in('trip_id', tripIds);
        const bookingsArr = bookings || [];
        totalBooked = bookingsArr.filter(b => (b.status || '').toLowerCase() !== 'cancelled').length;
        checkedIn = bookingsArr.filter(b => (b.status || '').toLowerCase() === 'checked-in').length;
      } catch {}
    }

    // On-time %: prefer actual start/end times if present
    let onTimePct = 0;
    if ((data||[]).length > 0) {
      let evaluated = 0; let ontime = 0;
      (data || []).forEach(t => {
        const actualStart = t.actual_departure_time ? new Date(t.actual_departure_time).getTime() : null;
        const actualEnd = t.actual_arrival_time ? new Date(t.actual_arrival_time).getTime() : null;
        if (!actualStart || !actualEnd) return;
        evaluated += 1;
        const dep = new Date(t.departure_time).getTime();
        const arr = new Date(t.arrival_time).getTime();
        const startOk = actualStart >= (dep - 30*60000) && actualStart <= (dep + 5*60000);
        const endOk = actualEnd >= (arr - 30*60000) && actualEnd <= (arr + 60*60000);
        if (startOk && endOk) ontime += 1;
      });
      onTimePct = evaluated ? Math.round((ontime / evaluated) * 100) : 0;
    }

    // Fatigue with company thresholds: derive fit-to-drive messaging
    const { data: shifts } = await supabase.from('driver_shifts').select('start_time, end_time').eq('driver_id', userId).gte('start_time', start.toISOString()).lte('end_time', end.toISOString());
    const totalHrs = (shifts||[]).reduce((s,sh)=> s + ((new Date(sh.end_time||Date.now()) - new Date(sh.start_time))/3600000), 0);
    let fatigue = 'OK';
    try {
      const { data: cfg } = await supabase.from('company_settings').select('max_continuous_drive_hours, min_rest_hours, override_fit_hours').eq('company_id', window.companyId).maybeSingle();
      const maxDrive = Number(cfg?.max_continuous_drive_hours ?? 24);
      const minRest = Number(cfg?.min_rest_hours ?? 8);
      const overrideHours = cfg?.override_fit_hours ? String(cfg.override_fit_hours) : null; // e.g., "3-5"
      // Simplified interpretation per spec
      if (totalHrs >= maxDrive) {
        fatigue = 'Avoid driving: exceeding limit';
      }
      // Assume last rest duration for today (approx):
      let restHrs = 0;
      if ((shifts||[]).length >= 2) {
        const sorted = [...shifts].sort((a,b)=> new Date(a.start_time)-new Date(b.start_time));
        for (let i=1;i<sorted.length;i++) {
          const prevEnd = new Date(sorted[i-1].end_time || sorted[i-1].start_time).getTime();
          const nextStart = new Date(sorted[i].start_time).getTime();
          restHrs = Math.max(restHrs, (nextStart - prevEnd)/3600000);
        }
      }
      if (restHrs < minRest && totalHrs >= 10) {
        fatigue = 'Not fit to drive';
      } else if (totalHrs >= 10 && restHrs >= 2) {
        fatigue = 'Can Drive';
      } else if (totalHrs >= 15 && restHrs < 8) {
        fatigue = 'Avoid driving longer';
      } else {
        fatigue = totalHrs > 10 ? 'High' : totalHrs > 8 ? 'Elevated' : 'Fit to drive';
      }
      if (overrideHours) {
        // If admin approved a not-fit driver, show limited hours window e.g., 3-5 hours
        fatigue = `Approved limited: ${overrideHours} hrs`;
      }
    } catch {
      fatigue = totalHrs > 10 ? 'High' : totalHrs > 8 ? 'Elevated' : 'OK';
    }

    // Incidents approved today for this driver
    let incidentsApproved = 0;
    try {
      const { data: inc } = await supabase
        .from('incidents')
        .select('incident_id, status, created_at, driver_id')
        .eq('driver_id', userId)
        .eq('status', 'Approved')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      incidentsApproved = (inc || []).length;
    } catch {}

    setKpis({ passengers: `${checkedIn}/${totalBooked}`, tripsCompleted: completed, onTime: onTimePct, incidents: incidentsApproved, fatigue });
    try { const { data } = await computeDriverEarningsEstimate({}); setEarn({ estimate: data?.estimate || 0, completedTrips: data?.completedTrips || 0 }); } catch {}
  };

  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [userId]);

  const withinStartWindow = (row) => {
    const dep = new Date(row.departure_time).getTime();
    const now = Date.now();
    return now >= (dep - 30*60000);
  };
  const withinEndWindow = (row) => {
    const arr = new Date(row.arrival_time || row.departure_time).getTime();
    const now = Date.now();
    return now >= (arr - 30*60000) && now <= (arr + 60*60000);
  };
  const startTrip = async (row) => { if (!withinStartWindow(row)) { alert('Can start only within 30 minutes before departure.'); return; } await updateTripStatus(row.trip_id, 'InProgress'); load(); };
  const completeTrip = async (row) => { if (!withinEndWindow(row)) { alert('Can end only between 30 minutes before and up to 1 hour after ETA.'); return; } await updateTripStatus(row.trip_id, 'Completed'); load(); };
  const reportIssue = async () => { const details = prompt('Issue details'); if (!details) return; await createIncident({ title: 'Driver Report', description: details, type: 'driver_report', severity: 'Medium' }); alert('Submitted'); };
  const reportIncidentForTrip = async (row) => { const details = prompt('Incident details'); if (!details) return; await createIncident({ title: 'Trip Incident', description: details, type: 'driver_report', severity: 'Medium', tripId: row.trip_id || null }); alert('Submitted'); };
  const markDelayed = async (row) => { const reason = prompt('Reason for delay'); if (!reason) return; await updateTripStatusWithReason(row.trip_id, 'Delayed', reason); load(); };
  const openScanner = (row, mode) => { setScanTrip(row); setScanMode(mode); setQrText(''); setQrOpen(true); };
  const handleScanConfirm = async () => {
    if (!scanTrip) { setQrOpen(false); return; }
    if (scanMode === 'start') {
      if (!withinStartWindow(scanTrip)) { alert('Cannot start yet. Within 30 minutes before departure.'); return; }
      // Optional: record minimal pre-trip inspection
      try { await recordDriverInspection({ trip_id: scanTrip.trip_id, items: { quick_check: true }, passed: true }); } catch {}
      await updateTripStatus(scanTrip.trip_id, 'InProgress');
    } else {
      if (!withinEndWindow(scanTrip)) { alert('Cannot end yet. Only near ETA.'); return; }
      await updateTripStatus(scanTrip.trip_id, 'Completed');
    }
    setQrOpen(false); setScanTrip(null); setQrText(''); load();
  };

  useEffect(() => {
    if (!qrOpen) return;
    // lazy load html5-qrcode for camera scanning option
    let cancelled = false;
    let scriptEl = null;
    let scanner = null;
    if (!window.Html5QrcodeScanner) {
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.10/minified/html5-qrcode.min.js';
      scriptEl.async = true;
      scriptEl.onload = () => { if (!cancelled) setTimeout(() => setCameraLoaded(true), 0); };
      document.body.appendChild(scriptEl);
    } else {
      setTimeout(() => setCameraLoaded(true), 0);
    }
    const maybeStartScanner = () => {
      try {
        if (!window.Html5QrcodeScanner) return;
        if (!document.getElementById('qr-reader')) return;
        const ScannerCtor = window.Html5QrcodeScanner;
        scanner = new ScannerCtor('qr-reader', { fps: 10, qrbox: 220, rememberLastUsedCamera: true });
        scanner.render((decodedText) => { setQrText(decodedText || ''); setTimeout(handleScanConfirm, 50); }, () => {});
      } catch {}
    };
    const id = setTimeout(maybeStartScanner, 300);
    return () => { cancelled = true; clearTimeout(id); try { scanner?.clear(); } catch {} if (scriptEl) { try { scriptEl.onload = null; } catch {} } };
  }, [qrOpen]);

  const actions = [
    { label: 'Report Issue', icon: 'report', onClick: reportIssue },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Passengers Today" value={kpis.passengers} icon="passengers" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Trips Completed" value={kpis.tripsCompleted} icon="trips" color="success" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="On-time %" value={`${kpis.onTime}%`} icon="percent" color="info" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Incidents" value={kpis.incidents} icon="incident" color="warning" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Fatigue" value={kpis.fatigue} icon="warning" color={kpis.fatigue==='High'?'error':kpis.fatigue==='Elevated'?'warning':'success'} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Earnings (est.)" value={`$${earn.estimate.toFixed(2)}`} icon="revenue" color="secondary" /></Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <DashboardCard title="Today\'s Trips" variant="outlined">
          <DataTable
            data={trips}
            columns={[
              { field: 'departure_time', headerName: 'Departure', type: 'date' },
              { field: 'route_name', headerName: 'Route' },
              { field: 'bus_id', headerName: 'Bus' },
              { field: 'status', headerName: 'Status' },
            ]}
            rowActions={[
              { label: 'Start', icon: 'play', onClick: (row) => startTrip(row) },
              { label: 'Scan to Start', icon: 'qr', onClick: (row) => openScanner(row, 'start') },
              { label: 'Complete', icon: 'check', onClick: (row) => completeTrip(row) },
              { label: 'Scan to End', icon: 'qr', onClick: (row) => openScanner(row, 'end') },
              { label: 'Delayed', icon: 'warning', onClick: (row) => markDelayed(row) },
              { label: 'Report Incident', icon: 'incident', onClick: (row) => reportIncidentForTrip(row) },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>

      <Grid item xs={12}>
        <DashboardCard title="Quick Actions" variant="outlined">
          <Button variant="contained" onClick={() => { if (typeof window.setDriverDashboardTab === 'function') window.setDriverDashboardTab(3); }}>View calendar schedule</Button>
          <Button variant="outlined" sx={{ ml: 1 }} onClick={() => {
            const candidate = (trips||[]).find(t => ((t.status||'').toLowerCase() === 'scheduled' || (t.status||'').toLowerCase() === 'pending')) || (trips||[])[0];
            if (!candidate) { alert('No trips found for today'); return; }
            openScanner(candidate, 'start');
          }}>Start todays trip</Button>
          <Button variant="outlined" sx={{ ml: 1 }} onClick={async () => {
            const candidate = (trips||[]).find(t => ((t.status||'').toLowerCase() === 'scheduled' || (t.status||'').toLowerCase() === 'pending')) || (trips||[])[0];
            if (!candidate) { alert('No trips found for today'); return; }
            await recordDriverInspection({ trip_id: candidate.trip_id, items: { brakes: true, lights: true, first_aid: true }, passed: true });
            alert('Pre-trip inspection recorded');
          }}>Pre trip inspection</Button>
          <Button variant="text" color="error" sx={{ ml: 1 }} onClick={()=>{ createIncident({ title:'SOS', description:'Emergency alert by driver', type:'SOS', severity:'High' }); alert('SOS sent'); }}>SOS</Button>
        </DashboardCard>
      </Grid>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{scanMode === 'start' ? 'Scan to Start Trip' : 'Scan to End Trip'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>You may scan a QR/barcode or enter a code manually.</Typography>
          <TextField size="small" fullWidth label="QR/Code" value={qrText} onChange={e => setQrText(e.target.value)} sx={{ mb: 2 }} />
          <div id="qr-reader" style={{ width: '100%', display: cameraLoaded ? 'block' : 'none' }} />
          {!cameraLoaded && <Typography variant="caption" color="text.secondary">Camera scanner will load if permitted.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleScanConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}


