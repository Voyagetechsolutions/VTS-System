import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, IconButton } from '@mui/material';
import { getBookingsRealtime, approveBooking, handleRefund } from '../../../supabase/api';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';

export default function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    getBookingsRealtime().then(({ data }) => setBookings(data || []));
  }, []);

  const filtered = bookings.filter(b => b.passenger_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField label="Search Bookings" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Passenger Name</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => (
            <TableRow key={b.booking_id}>
              <TableCell>{b.passenger_name}</TableCell>
              <TableCell>{b.route}</TableCell>
              <TableCell>{b.status}</TableCell>
              <TableCell>
                <Button size="small" color="success" onClick={() => approveBooking(b.booking_id)}><CheckIcon /></Button>
                <Button size="small" color="error" onClick={() => handleRefund(b.booking_id)}><BlockIcon /></Button>
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
