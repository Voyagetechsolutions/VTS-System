import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Typography, Chip } from '@mui/material';
import { supabase } from '../../../supabase/client';

function dayStart(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export default function DriverWeekCalendar({ driverId }) {
  const [trips, setTrips] = useState([]);
  const [shifts, setShifts] = useState([]);
  const uid = driverId || window.userId || localStorage.getItem('userId');

  const start = useMemo(() => dayStart(new Date()), []);
  const end = useMemo(() => { const e = addDays(start, 6); e.setHours(23,59,59,999); return e; }, [start]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: t }, { data: s }] = await Promise.all([
          supabase.from('trips_with_details').select('trip_id, route_name, departure_time, arrival_time, status').eq('driver_id', uid).gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString()).order('departure_time', { ascending: true }),
          supabase.from('driver_shifts').select('start_time, end_time, status').eq('driver_id', uid).gte('start_time', start.toISOString()).lte('end_time', end.toISOString()).order('start_time', { ascending: true }),
        ]);
        setTrips(t || []); setShifts(s || []);
      } catch {}
    })();
  }, [uid, start, end]);

  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

  const byDay = useMemo(() => {
    const map = new Map();
    days.forEach(d => map.set(d.toDateString(), { trips: [], shifts: [] }));
    (trips || []).forEach(t => {
      const key = new Date(t.departure_time).toDateString();
      if (!map.has(key)) map.set(key, { trips: [], shifts: [] });
      map.get(key).trips.push(t);
    });
    (shifts || []).forEach(s => {
      const key = new Date(s.start_time).toDateString();
      if (!map.has(key)) map.set(key, { trips: [], shifts: [] });
      map.get(key).shifts.push(s);
    });
    return map;
  }, [days, trips, shifts]);

  return (
    <Box>
      <Grid container spacing={1}>
        {days.map((d, idx) => {
          const cell = byDay.get(d.toDateString()) || { trips: [], shifts: [] };
          return (
            <Grid key={idx} item xs={12} sm={6} md={3} lg={12/7}>
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1, minHeight: 110 }}>
                <Typography variant="subtitle2">{d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</Typography>
                {(cell.shifts || []).map((s, i) => (
                  <Chip key={i} size="small" color="secondary" sx={{ mr: .5, mt: .5 }} label={`Shift ${new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
                ))}
                {(cell.trips || []).map((t) => (
                  <Chip key={t.trip_id} size="small" color="primary" sx={{ mr: .5, mt: .5 }} label={`${new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${t.route_name}`} />
                ))}
                {(!cell.trips?.length && !cell.shifts?.length) && (
                  <Typography variant="caption" color="text.secondary">No items</Typography>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}


