import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, Select, MenuItem } from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [form, setForm] = useState({ booking_id: '', amount: '', method: 'cash' });

  const load = async () => {
    const { data } = await supabase
      .from('payments')
      .select('transaction_id, booking_id, amount, payment_method, paid_at, status')
      .order('paid_at', { ascending: false });
    setPayments(data || []);
  };
  useEffect(() => { load(); }, []);

  const markPaid = async () => {
    if (!form.booking_id || !form.amount) return;
    await supabase.rpc('record_payment', { p_booking_id: form.booking_id, p_method: form.method, p_amount: Number(form.amount) });
    setForm({ booking_id: '', amount: '', method: 'cash' });
    load();
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <TextField label="Booking ID" value={form.booking_id} onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))} />
        <TextField label="Amount" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        <Select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
          <MenuItem value="cash">Cash</MenuItem>
          <MenuItem value="card">Card</MenuItem>
          <MenuItem value="mobile_money">Mobile Money</MenuItem>
        </Select>
        <Button variant="contained" onClick={markPaid}>Record Payment</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Transaction ID</TableCell>
            <TableCell>Booking ID</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Paid At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(payments || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
            <TableRow key={p.transaction_id}>
              <TableCell>{p.transaction_id}</TableCell>
              <TableCell>{p.booking_id}</TableCell>
              <TableCell>{p.amount}</TableCell>
              <TableCell>{p.payment_method}</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>{p.paid_at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={(payments || []).length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
      />
    </>
  );
}
