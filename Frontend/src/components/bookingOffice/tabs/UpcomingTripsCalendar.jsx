import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Typography, Chip } from '@mui/material';
import { supabase } from '../../../supabase/client';

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export default function UpcomingTripsCalendar({ companyId, branchId, onBook }) {
  const [selected, setSelected] = useState(startOfDay(new Date()));
  const [tripsByDay, setTripsByDay] = useState(new Map());
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripSeats, setTripSeats] = useState({ capacity: 0, taken: new Set(), blocked: new Set() });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const days = useMemo(() => Array.from({ length: 14 }).map((_, i) => startOfDay(addDays(new Date(), i))), []);

  useEffect(() => {
    (async () => {
      const start = startOfDay(new Date());
      const end = addDays(start, 13); end.setHours(23,59,59,999);
      let q = supabase
        .from('trips_with_details')
        .select('trip_id, route_name, departure_time, capacity, passenger_count, status, branch_id')
        .eq('company_id', companyId)
        .gte('departure_time', start.toISOString())
        .lte('departure_time', end.toISOString())
        .order('departure_time', { ascending: true });
      if (branchId) q = q.eq('branch_id', branchId);
      const { data } = await q;
      const map = new Map();
      (data||[]).forEach(t => {
        const key = startOfDay(new Date(t.departure_time)).toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(t);
      });
      setTripsByDay(map);
    })();
  }, [companyId, branchId]);

  const selectedKey = selected.toDateString();
  const trips = tripsByDay.get(selectedKey) || [];

  const loadSeats = async (trip) => {
    if (!trip) return;
    const [{ data: booked }, { data: blocked }] = await Promise.all([
      supabase.from('bookings').select('seat_number').eq('trip_id', trip.trip_id),
      supabase.from('trip_seats').select('seat_number, blocked').eq('trip_id', trip.trip_id),
    ]);
    const capacity = Number(trip.capacity || 50);
    const takenSet = new Set((booked||[]).map(b => Number(b.seat_number)));
    const blockedSet = new Set((blocked||[]).filter(s => s.blocked).map(s => Number(s.seat_number)));
    setTripSeats({ capacity, taken: takenSet, blocked: blockedSet });
    setSelectedSeats([]);
  };

  const toggleSeat = (n) => {
    if (tripSeats.taken.has(n) || tripSeats.blocked.has(n)) return;
    setSelectedSeats(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Upcoming (14 days)</Typography>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {days.map((d, idx) => {
          const key = d.toDateString(); const count = (tripsByDay.get(key) || []).length;
          const isSel = key === selectedKey;
          return (
            <Grid item key={idx}>
              <Chip label={`${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}${count?` (${count})`:''}`} color={isSel ? 'primary' : 'default'} onClick={() => setSelected(d)} />
            </Grid>
          );
        })}
      </Grid>
      <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1, maxHeight: 260, overflow: 'auto' }}>
        {trips.map(t => (
          <Box key={t.trip_id} sx={{ py: .75, borderBottom: '1px dashed #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div>{new Date(t.departure_time).toLocaleString()} • {t.route_name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Seats: {(t.capacity||0)-(t.passenger_count||0)} / {t.capacity||0} • Status: {t.status||'-'}</div>
              </div>
              <Box sx={{ display: 'flex', gap: .5 }}>
                <Chip size="small" label="Seats" onClick={() => { setSelectedTrip(t); loadSeats(t); }} />
                <Chip size="small" color="primary" label="Book" onClick={() => { onBook && onBook({ trip: t }); }} />
              </Box>
            </Box>
            {selectedTrip?.trip_id === t.trip_id && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Select seats to allocate (grey=booked, yellow=reserved, blue=available)</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: .5, maxWidth: 260, mt: .5 }}>
                  {Array.from({ length: Math.max(0, tripSeats.capacity) }, (_, i) => i+1).map(n => {
                    const isTaken = tripSeats.taken.has(n);
                    const isBlocked = tripSeats.blocked.has(n);
                    const selected = selectedSeats.includes(n);
                    const color = isBlocked ? 'warning' : (isTaken ? 'default' : 'primary');
                    return (
                      <Chip key={n} label={n} color={selected ? 'success' : color} variant={selected ? 'filled' : 'outlined'} clickable={!isTaken && !isBlocked} onClick={() => toggleSeat(n)} />
                    );
                  })}
                </Box>
                <Box sx={{ mt: .5 }}>
                  <Chip size="small" color="primary" label="Book selected seats" onClick={() => { if (onBook) onBook({ trip: selectedTrip, seats: selectedSeats }); }} />
                </Box>
              </Box>
            )}
          </Box>
        ))}
        {trips.length === 0 && <Typography variant="caption" color="text.secondary">No trips for selected day.</Typography>}
      </Box>
    </Box>
  );
}


