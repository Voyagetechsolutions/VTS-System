import React, { useEffect, useMemo, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, TextField } from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function RoutesTab() {
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('trips_with_company')
        .select('trip_id, route_id, bus_id, company_id, origin, destination, date, departure_time, arrival_time')
        .eq('company_id', window.companyId)
        .order('date', { ascending: true });
      const busIds = Array.from(new Set((data||[]).map(r => r.bus_id).filter(Boolean)));
      const [{ data: busesRaw, error: busErr }, { data: bookings }] = await Promise.all([
        busIds.length ? supabase.from('buses').select('bus_id, license_plate, model, capacity').in('bus_id', busIds) : Promise.resolve({ data: [] }),
        supabase.from('bookings').select('booking_id, trip_id, status')
      ]);
      let buses = busesRaw || [];
      if (busErr && String(busErr.message || '').toLowerCase().includes('model')) {
        const { data: fallback } = await supabase.from('buses').select('bus_id, license_plate, capacity').in('bus_id', busIds);
        buses = fallback || [];
      }
      const busMap = new Map((buses||[]).map(b => [b.bus_id, b]));
      const byTrip = new Map();
      (bookings||[]).forEach(b => { if ((b.status||'Confirmed') !== 'Cancelled') byTrip.set(b.trip_id, (byTrip.get(b.trip_id)||0)+1); });
      const withMeta = (data||[]).map(r => {
        const bus = busMap.get(r.bus_id) || {}; const cap = Number(bus.capacity||0); const sold = Number(byTrip.get(r.trip_id)||0);
        return { ...r, bus_license: bus.license_plate || '-', bus_model: bus.model || '-', capacity: cap, remaining: cap > 0 ? (cap - sold) : '-' };
      });
      setRoutes(withMeta);
    })();
  }, []);

  const filtered = routes.filter(r => r.origin.toLowerCase().includes(search.toLowerCase()) || r.destination.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField label="Search Routes" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Origin</TableCell>
            <TableCell>Destination</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Bus</TableCell>
            <TableCell>Remaining Seats</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r) => (
            <TableRow key={r.trip_id}>
              <TableCell>{r.origin}</TableCell>
              <TableCell>{r.destination}</TableCell>
              <TableCell>{r.date} {r.departure_time}</TableCell>
              <TableCell>{r.date} {r.arrival_time}</TableCell>
              <TableCell>{r.bus_license} {r.bus_model && `(${r.bus_model})`}</TableCell>
              <TableCell>{r.remaining}</TableCell>
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
    </>
  );
}
