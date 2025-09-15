import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField } from '@mui/material';
import { getTripsForBoarding, checkInPassenger, scanTicket } from '../../../supabase/api';

export default function TripBoardingTab() {
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    getTripsForBoarding().then(({ data }) => setTrips(data || []));
  }, []);

  const filtered = trips.filter(t => t.route.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField label="Search Trips" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Route</TableCell>
            <TableCell>Departure</TableCell>
            <TableCell>Passengers</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t) => (
            <TableRow key={t.trip_id}>
              <TableCell>{t.route}</TableCell>
              <TableCell>{t.departure}</TableCell>
              <TableCell>{t.passengers.length}</TableCell>
              <TableCell>
                <Button size="small" color="primary" onClick={() => checkInPassenger(t.trip_id)}>Check-In</Button>
                <Button size="small" color="success" onClick={() => scanTicket(t.trip_id)}>Scan Ticket</Button>
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
    </>
  );
}
