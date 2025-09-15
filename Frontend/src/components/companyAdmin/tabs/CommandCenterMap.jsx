import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { subscribeToBuses } from '../../../supabase/realtime';
import { supabase } from '../../../supabase/client';

export default function CommandCenterMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [buses, setBuses] = useState([]);

  const load = async () => {
    const { data } = await supabase
      .from('buses')
      .select('bus_id, license_plate, last_lat, last_lng, status')
      .eq('company_id', window.companyId);
    setBuses(data || []);
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

  return (
    <div ref={mapRef} style={{ height: 320, width: '100%', borderRadius: 8, overflow: 'hidden' }} />
  );
}
