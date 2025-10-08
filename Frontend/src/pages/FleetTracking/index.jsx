import React, { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography, Button, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../../utils/apiClient';
import { connectBusHub, on as onHub, disconnectBusHub } from '../../utils/signalR';
import 'leaflet/dist/leaflet.css';

export default function FleetTrackingPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();
  const [range, setRange] = useState({ start: '', end: '' });
  const [selectedBusId, setSelectedBusId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimerRef = useRef(null);
  const playbackIdxRef = useRef(0);
  const playbackDataRef = useRef([]);
  const LRef = useRef(null);

  // Load Leaflet and initialize map
  useEffect(() => {
    (async () => {
      try {
        const L = (await import('leaflet')).default;
        LRef.current = L;
        if (!mapInstanceRef.current && mapRef.current) {
          const center = [-26.2041, 28.0473]; // Johannesburg default
          const map = L.map(mapRef.current).setView(center, 6);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);
          mapInstanceRef.current = map;
        }
      } catch (e) {
        console.error('Leaflet load failed', e);
      }
    })();
  }, []);

  // Connect SignalR and subscribe to events
  useEffect(() => {
    (async () => {
      const hub = await connectBusHub(process.env.REACT_APP_API_URL || '');
      if (!hub) return;
      // Live GPS updates
      const off1 = onHub('BusLocationUpdated', (evt) => {
        try {
          const { BusId, Latitude, Longitude, Speed, Status } = evt || {};
          if (!BusId || Latitude == null || Longitude == null) return;
          upsertMarker(BusId, Number(Latitude), Number(Longitude), Status, Speed);
        } catch {}
      });
      // Alerts
      const off2 = onHub('AlertReceived', (a) => {
        try {
          enqueueSnackbar(a?.Message || 'Alert received', { variant: (a?.Severity === 'critical' ? 'error' : (a?.Severity === 'warning' ? 'warning' : 'info')) });
        } catch {}
      });
      return () => { try { off1?.(); off2?.(); } catch {} };
    })();
    return () => { disconnectBusHub(); };
  }, []);

  const upsertMarker = (busId, lat, lng, status, speed) => {
    const L = LRef.current; const map = mapInstanceRef.current; if (!L || !map) return;
    const key = String(busId);
    const markers = markersRef.current;
    const color = status === 'InService' ? 'green' : status === 'Delayed' ? 'orange' : 'blue';
    const icon = L.divIcon({ className: 'bus-marker', html: `\n      <div style="background:${color}; width:10px; height:10px; border-radius:50%"></div>` });
    if (!markers[key]) {
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.bindPopup(`<div><strong>Bus ${busId}</strong><br/>Status: ${status || '-'}<br/>Speed: ${Number(speed || 0).toFixed(1)} km/h</div>`);
      markers[key] = marker;
    } else {
      markers[key].setLatLng([lat, lng]);
    }
  };

  const loadStatuses = async () => {
    try {
      const data = await api.get('/api/fleet/buses/status');
      const L = LRef.current; const map = mapInstanceRef.current; if (!L || !map) return;
      (data || []).forEach(d => {
        upsertMarker(d.busId || d.BusId, Number(d.latitude ?? d.Latitude), Number(d.longitude ?? d.Longitude), d.status ?? d.Status, d.speed ?? d.Speed);
      });
      const first = (data || [])[0];
      if (first) map.setView([Number(first.latitude ?? first.Latitude), Number(first.longitude ?? first.Longitude)], 8);
    } catch (e) {
      console.error(e);
      enqueueSnackbar('Failed to load latest bus statuses', { variant: 'error' });
    }
  };

  useEffect(() => { loadStatuses(); }, []);

  const fetchHistory = async () => {
    if (!selectedBusId || !range.start || !range.end) {
      enqueueSnackbar('Select bus and date range', { variant: 'warning' });
      return;
    }
    try {
      const params = new URLSearchParams({ start: new Date(range.start).toISOString(), end: new Date(range.end).toISOString() }).toString();
      const data = await api.get(`/api/fleet/buses/${encodeURIComponent(selectedBusId)}/history?${params}`);
      playbackDataRef.current = (data || []).map(p => ({ lat: Number(p.latitude ?? p.Latitude), lng: Number(p.longitude ?? p.Longitude), t: p.timestamp ?? p.Timestamp }));
      playbackIdxRef.current = 0;
      drawHistoryPath();
      enqueueSnackbar(`Loaded ${playbackDataRef.current.length} points`, { variant: 'success' });
    } catch (e) {
      console.error(e);
      enqueueSnackbar('Failed to load history', { variant: 'error' });
    }
  };

  const drawHistoryPath = () => {
    const L = LRef.current; const map = mapInstanceRef.current; if (!L || !map) return;
    if (polylineRef.current) { try { map.removeLayer(polylineRef.current); } catch {} polylineRef.current = null; }
    const pts = playbackDataRef.current.map(p => [p.lat, p.lng]);
    if (pts.length > 1) {
      const line = L.polyline(pts, { color: 'red' }).addTo(map);
      polylineRef.current = line;
      map.fitBounds(line.getBounds(), { padding: [20, 20] });
    }
  };

  const startPlayback = () => {
    const pts = playbackDataRef.current; const map = mapInstanceRef.current; if (!pts.length || !map) return;
    setIsPlaying(true);
    const step = () => {
      if (playbackIdxRef.current >= pts.length) { setIsPlaying(false); return; }
      const p = pts[playbackIdxRef.current++];
      map.setView([p.lat, p.lng], map.getZoom());
      playbackTimerRef.current = setTimeout(step, 500);
    };
    step();
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playbackTimerRef.current) { clearTimeout(playbackTimerRef.current); playbackTimerRef.current = null; }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>MiFleet - Fleet Tracking</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Bus ID" size="small" value={selectedBusId} onChange={e => setSelectedBusId(e.target.value)} sx={{ width: 140 }} />
        <TextField label="Start" type="datetime-local" size="small" value={range.start} onChange={e => setRange(r => ({ ...r, start: e.target.value }))} InputLabelProps={{ shrink: true }} />
        <TextField label="End" type="datetime-local" size="small" value={range.end} onChange={e => setRange(r => ({ ...r, end: e.target.value }))} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" onClick={fetchHistory}>Load History</Button>
        {!isPlaying ? <Button variant="outlined" onClick={startPlayback} disabled={!playbackDataRef.current.length}>Play</Button> : <Button variant="outlined" color="secondary" onClick={stopPlayback}>Stop</Button>}
        <Button variant="text" onClick={loadStatuses}>Refresh Live</Button>
      </Stack>
      <div ref={mapRef} style={{ height: 480, width: '100%', borderRadius: 8, overflow: 'hidden', background: '#f7f7f7' }} />
    </Box>
  );
}
