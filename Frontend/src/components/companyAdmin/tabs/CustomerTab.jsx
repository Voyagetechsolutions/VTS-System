import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function CustomerTab() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const load = async () => {
    const { data } = await supabase.from('customers').select('*').eq('company_id', window.companyId);
    setCustomers(data || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField label="Search Customers" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Booking History</TableCell>
            <TableCell>Complaints</TableCell>
            <TableCell>Special Requests</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c) => (
            <TableRow key={c.customer_id}>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
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
