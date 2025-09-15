import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField } from '@mui/material';
import { getSeatAssignments, reassignSeat, flagOverbooking } from '../../../supabase/api';

export default function SeatTab() {
  const [seats, setSeats] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    getSeatAssignments().then(({ data }) => setSeats(data || []));
  }, []);

  const filtered = seats.filter(s => s.passenger_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField label="Search Seats" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Passenger Name</TableCell>
            <TableCell>Seat Number</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s) => (
            <TableRow key={s.seat_id}>
              <TableCell>{s.passenger_name}</TableCell>
              <TableCell>{s.seat_number}</TableCell>
              <TableCell>{s.status}</TableCell>
              <TableCell>
                <Button size="small" color="primary" onClick={() => reassignSeat(s.seat_id)}>Reassign</Button>
                <Button size="small" color="error" onClick={() => flagOverbooking(s.seat_id)}>Flag Overbooking</Button>
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
