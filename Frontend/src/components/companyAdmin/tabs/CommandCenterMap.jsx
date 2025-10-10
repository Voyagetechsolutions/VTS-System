import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { subscribeToBuses } from '../../../supabase/realtime';
import { supabase } from '../../../supabase/client';

export default function CommandCenterMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const incidentMarkersRef = useRef({});
  const [buses, setBuses] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [showIncidents, setShowIncidents] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('buses')
      .select('bus_id, license_plate, last_lat, last_lng, status')
      .eq('company_id', window.companyId);
    setBuses(data || []);

    // Load open incidents with coordinates if available
    try {
      const { data: inc } = await supabase
        .from('incidents')
        .select('incident_id, category, status, latitude, longitude, created_at, description')
        .eq('company_id', window.companyId)
        .neq('status', 'resolved')
        .order('created_at', { ascending: false })
        .limit(100);
      setIncidents((inc || []).filter(i => i.latitude && i.longitude));
    } catch {}
  };

  useEffect(() => {
    load();
    const sub = subscribeToBuses(() => load());
    return () => { try { sub.unsubscribe?.(); } catch {} };
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const center = [0, 0];
    const map = L.map(mapRef.current).setView(center, 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    // Fit to first bus if available
    const valid = (buses || []).filter(b => b.last_lat && b.last_lng);
    if (valid.length > 0) {
      map.setView([valid[0].last_lat, valid[0].last_lng], 8);
    }
    // Update markers
    const markers = markersRef.current;
    valid.forEach(b => {
      const key = b.bus_id;
      if (!markers[key]) {
        const marker = L.marker([b.last_lat, b.last_lng]).addTo(map);
        marker.bindPopup(`<div><strong>${b.license_plate}</strong><br/>Status: ${b.status || '-'}</div>`);
        markers[key] = marker;
      } else {
        markers[key].setLatLng([b.last_lat, b.last_lng]);
      }
    });
  }, [buses]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const markers = incidentMarkersRef.current;
    // Clear markers if toggled off
    if (!showIncidents) {
      Object.values(markers).forEach(m => { try { map.removeLayer(m); } catch {} });
      incidentMarkersRef.current = {};
      return;
    }
    (incidents || []).forEach(i => {
      const key = i.incident_id;
      if (!markers[key]) {
        const redIcon = new L.Icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });
        const m = L.marker([i.latitude, i.longitude], { icon: redIcon }).addTo(map);
        m.bindPopup(`<div><strong>${i.category || 'Incident'}</strong><br/>${i.description || ''}<br/>Status: ${i.status || '-'}<br/>${i.created_at ? new Date(i.created_at).toLocaleString() : ''}</div>`);
        markers[key] = m;
      } else {
        markers[key].setLatLng([i.latitude, i.longitude]);
      }
    });
  }, [incidents, showIncidents]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height: 320, width: '100%', borderRadius: 8, overflow: 'hidden' }} />
      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.9)', padding: '8px 12px', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Legend</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, background: '#1976d2', display: 'inline-block', borderRadius: 2 }} />
          <span>Buses</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ width: 10, height: 10, background: '#d32f2f', display: 'inline-block', borderRadius: 2 }} />
          <span>Incidents</span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showIncidents} onChange={e => setShowIncidents(e.target.checked)} />
          Show Incidents
        </label>
      </div>
    </div>
  );
}
