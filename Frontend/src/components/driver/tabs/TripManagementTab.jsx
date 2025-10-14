import React, { useEffect, useRef, useState } from 'react';
import { Grid, Box, Button, Typography, Stack } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DriverWeekCalendar from './DriverWeekCalendar';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';
import { updateTripStatus, recordDriverInspection, getPassengerManifest, createIncident } from '../../../supabase/api';
import { isEnabled } from '../../../utils/featureFlags';

export default function TripManagementTab() {
  const [trips, setTrips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const userId = window.userId || localStorage.getItem('userId');

  const load = async () => {
    const { data } = await supabase
      .from('trips_with_details')
      .select('trip_id, route_name, departure_time, arrival_time, bus_id, status, passenger_count, capacity')
    setTrips(data || []);
  };

  const startTrip = async () => {
    if (!selected) return;
    // enforce pre-trip inspection
    const confirm = window.confirm('Confirm pre-trip inspection is complete?');
    if (!confirm) return;
    await recordDriverInspection({ trip_id: selected.trip_id, items: { brakes: true, lights: true, first_aid: true }, passed: true });
    await updateTripStatus(selected.trip_id, 'InProgress');
    load();
  };
  const endTrip = async () => { if (!selected) return; await updateTripStatus(selected.trip_id, 'Completed'); load(); };
  const reportIssue = async () => { const details = prompt('Issue details'); if (!details) return; await createIncident({ title: 'Trip Incident', description: details, type: 'driver_report', severity: 'Medium', tripId: selected?.trip_id || null }); alert('Submitted'); };

  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [userId]);

  useEffect(() => {
    // Setup Web Speech recognition if enabled and available
    if (!isEnabled('voice_control')) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = async (event) => {
      const transcript = Array.from(event.results).map(r => r[0]?.transcript || '').join(' ').toLowerCase();
      if (transcript.includes('start trip')) {
        await startTrip();
      } else if (transcript.includes('complete') || transcript.includes('end trip')) {
        await endTrip();
      } else if (transcript.includes('report') || transcript.includes('issue')) {
        await reportIssue();
      } else if (transcript.includes('manifest')) {
        if (selected) {
          const { data } = await getPassengerManifest(selected.trip_id);
          alert(`Passengers: ${(data||[]).length}`);
        }
      }
    };
    rec.onend = () => {
      if (listening) {
        try { rec.start(); } catch (error) { console.warn('Speech recognition error:', error); }
      }
    };
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch (error) { console.warn('Speech recognition cleanup error:', error); } };
  }, [listening, selected, startTrip, endTrip, reportIssue]);

  const toggleVoice = async () => {
    const rec = recognitionRef.current;
    if (!rec) { alert('Voice not supported on this device/browser.'); return; }
    if (listening) {
      setListening(false);
      try { rec.stop(); } catch {}
    } else {
      setListening(true);
      try { rec.start(); } catch {}
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DashboardCard title="Quick Actions" variant="outlined">
          <Button size="small" variant="contained" onClick={async () => {
            const today = new Date(); today.setHours(0,0,0,0);
            const { data } = await supabase
              .from('trips_with_details')
              .select('trip_id, departure_time, status, route_name, bus_id')
              .eq('driver_id', userId)
              .gte('departure_time', today.toISOString())
              .lte('departure_time', new Date(today.getTime() + 24*3600*1000 - 1).toISOString())
              .order('departure_time', { ascending: true });
            const candidate = (data||[]).find(t => (String(t.status||'').toLowerCase() === 'scheduled' || String(t.status||'').toLowerCase() === 'pending')) || (data||[])[0];
            if (!candidate) { alert('No trips found for today'); return; }
            await updateTripStatus(candidate.trip_id, 'InProgress');
            load();
          }}>Start today’s trip</Button>
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Assigned Trips" variant="outlined">
          <DataTable
            data={trips}
            columns={[
              { field: 'departure_time', headerName: 'Departure', type: 'date' },
              { field: 'route_name', headerName: 'Route' },
              { field: 'bus_id', headerName: 'Bus' },
              { field: 'status', headerName: 'Status' },
              { field: 'passenger_count', headerName: 'Passengers' },
            ]}
            onRowClick={(row) => setSelected(row)}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Trip Details" variant="outlined" headerAction={<Stack direction="row" spacing={1}><Button size="small" variant={listening? 'contained':'outlined'} onClick={toggleVoice}>{listening ? 'Stop Voice' : 'Voice Control'}</Button></Stack>}>
          {!selected && <Typography variant="body2">Select a trip to view details</Typography>}
          {selected && (
            <Box>
              <Typography variant="subtitle2">Route: {selected.route_name}</Typography>
              <Typography variant="body2">Departure: {new Date(selected.departure_time).toLocaleString()}</Typography>
              <Typography variant="body2">Bus: {selected.bus_id}</Typography>
              <Typography variant="body2">Passengers: {selected.passenger_count} / {selected.capacity}</Typography>
              <Box sx={{ mt: 1, height: 220, background: '#eef2f7', borderRadius: 1 }} />
              <Box sx={{ mt: 1 }}>
                <Button size="small" onClick={async () => { const { data } = await getPassengerManifest(selected.trip_id); alert(`Passengers: ${(data||[]).length}`); }}>View Manifest</Button>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={startTrip}>Start Trip</Button>
                <Button variant="outlined" onClick={endTrip}>Mark Completed</Button>
                <Button variant="text" onClick={reportIssue}>Report Incident</Button>
              </Box>
            </Box>
          )}
        </DashboardCard>
      </Grid>
      <Grid item xs={12}>
        <DashboardCard title="Assigned Trips (Week)" variant="outlined">
          <DriverWeekCalendar driverId={userId} />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
