import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, Stack, Divider, Grid, Paper, Typography } from '@mui/material';
import BarChart from '../charts/BarChart';
import { supabase } from '../../../supabase/client';
import { getCompanyBookings, createBooking, updateBooking, deleteBooking, getCompanyRoutes, getCompanyBuses } from '../../../supabase/api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [branchChart, setBranchChart] = useState([]);
  const [channelChart, setChannelChart] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsForm, setActionsForm] = useState({ id_passport: '', nationality: '', route_id: '', departure: '', arrival: '', bus_id: '', status: '', ticket_code: '', ticket_type: '', ticket_issue_date: '', transaction_id: '', payment_method: '', amount: '', currency: '', payment_status: '', transaction_ref: '', discount: '', created_by_agent_id: '', origin_stop: '', destination_stop: '', contact_phone: '', contact_email: '' });
  const [routeOptions, setRouteOptions] = useState([]);
  const [busOptions, setBusOptions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ passenger_name: '', seat_number: 1, booking_date: new Date().toISOString(), payment_status: 'unpaid', booking_source: 'app' });

  useEffect(() => {
    (async () => {
      getCompanyBookings().then(({ data }) => setBookings(data || []));
      getCompanyRoutes().then(({ data }) => setRouteOptions(data || []));
      getCompanyBuses().then(({ data }) => setBusOptions(data || []));
      try {
        const cid = window.companyId;
        const { data: byBranch } = await supabase.rpc('bookings_by_branch', { p_company_id: cid });
        setBranchChart((byBranch || []).map(r => ({ label: r.branch_name || String(r.branch_id||'Unknown'), value: Number(r.count||0) })));
      } catch {}
      try {
        const cid = window.companyId;
        const { data: byChannel } = await supabase.rpc('bookings_by_channel', { p_company_id: cid });
        setChannelChart((byChannel || []).map(r => ({ label: String(r.channel||'Unknown'), value: Number(r.count||0) })));
      } catch {}
    })();
  }, []);

  const filtered = bookings.filter(b => b.passenger_name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setForm({ passenger_name: '', seat_number: 1, booking_date: new Date().toISOString(), payment_status: 'unpaid', booking_source: 'app' }); setDialogOpen(true); };
  const openEdit = (b) => { setEditing(b); setForm({ passenger_name: b.passenger_name, seat_number: b.seat_number, booking_date: b.booking_date, payment_status: b.payment_status || 'unpaid', booking_source: b.booking_source || 'app' }); setDialogOpen(true); };
  const openActions = (b) => {
    setEditing(b);
    setActionsForm({
      id_passport: b.id_passport || '',
      nationality: b.nationality || '',
      route_id: b.route_id || '',
      departure: b.departure || '',
      arrival: b.arrival || '',
      bus_id: b.bus_id || '',
      status: b.status || '',
      ticket_code: b.ticket_code || '',
      ticket_type: b.ticket_type || '',
      ticket_issue_date: b.ticket_issue_date || '',
      transaction_id: b.transaction_id || '',
      payment_method: b.payment_method || '',
      amount: b.amount || '',
      currency: b.currency || '',
      payment_status: b.payment_status || '',
      transaction_ref: b.transaction_ref || '',
      discount: b.discount || '',
      created_by_agent_id: b.created_by_agent_id || '',
      origin_stop: b.origin_stop || '',
      destination_stop: b.destination_stop || '',
      contact_phone: b.contact_phone || '',
      contact_email: b.contact_email || '',
    });
    setActionsOpen(true);
  };

  const saveActions = async () => {
    const bookingPayload = {
      id_passport: actionsForm.id_passport || null,
      nationality: actionsForm.nationality || null,
      route_id: actionsForm.route_id || null,
      departure: actionsForm.departure ? new Date(actionsForm.departure).toISOString() : null,
      arrival: actionsForm.arrival ? new Date(actionsForm.arrival).toISOString() : null,
      bus_id: actionsForm.bus_id || null,
      status: actionsForm.status || null,
      ticket_code: actionsForm.ticket_code || null,
      ticket_type: actionsForm.ticket_type || null,
      ticket_issue_date: actionsForm.ticket_issue_date ? new Date(actionsForm.ticket_issue_date).toISOString() : null,
      origin_stop: actionsForm.origin_stop || null,
      destination_stop: actionsForm.destination_stop || null,
      created_by_agent_id: actionsForm.created_by_agent_id || null,
      contact_phone: actionsForm.contact_phone || null,
      contact_email: actionsForm.contact_email || null,
      discount: actionsForm.discount || null,
    };
    await updateBooking(editing.booking_id, bookingPayload);

    if (actionsForm.transaction_id) {
      const tx = actionsForm.transaction_id;
      const resp = await window.supabase
        .from('payments')
        .upsert({
          transaction_id: tx,
          booking_id: editing.booking_id,
          amount: actionsForm.amount ? Number(actionsForm.amount) : null,
          payment_method: actionsForm.payment_method || null,
          paid_at: actionsForm.payment_status === 'paid' ? (new Date()).toISOString() : null,
          status: actionsForm.payment_status || null,
          currency: actionsForm.currency || null,
          transaction_ref: actionsForm.transaction_ref || null,
        }, { onConflict: 'transaction_id' });
      if (resp.error) console.error('Payment upsert error', resp.error);
    }

    setActionsOpen(false);
    getCompanyBookings().then(({ data }) => setBookings(data || []));
  };
  const save = async () => {
    if (editing) {
      await updateBooking(editing.booking_id, { passenger_name: form.passenger_name, seat_number: Number(form.seat_number || 0), booking_date: form.booking_date, payment_status: form.payment_status, booking_source: form.booking_source });
    } else {
      await createBooking({ passenger_name: form.passenger_name, seat_number: Number(form.seat_number || 0), booking_date: form.booking_date, payment_status: form.payment_status, booking_source: form.booking_source });
    }
    setDialogOpen(false);
    setEditing(null);
    setForm({ passenger_name: '', seat_number: 1, booking_date: new Date().toISOString(), payment_status: 'unpaid', booking_source: 'app' });
    getCompanyBookings().then(({ data }) => setBookings(data || []));
  };

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Bookings by Branch</Typography>
            <BarChart data={branchChart} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Bookings by Channel</Typography>
            <BarChart data={channelChart} />
          </Paper>
        </Grid>
      </Grid>
      <TextField label="Search Bookings" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={openNew}>Add Booking</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Passenger Name</TableCell>
            <TableCell>Seat Number</TableCell>
            <TableCell>Departure date & time</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => (
            <TableRow key={b.booking_id}>
              <TableCell>{b.passenger_name}</TableCell>
              <TableCell>{b.seat_number}</TableCell>
              <TableCell>{b.departure ? new Date(b.departure).toLocaleString() : '-'}</TableCell>
              <TableCell>
                <Button size="small" variant="outlined" onClick={() => openActions(b)}>Actions</Button>
                <IconButton onClick={() => openEdit(b)}><EditIcon /></IconButton>
                <IconButton onClick={async () => { await deleteBooking(b.booking_id); try { await supabase.from('activity_log').insert([{ company_id: window.companyId, type: 'booking_delete', message: JSON.stringify({ booking_id: b.booking_id, by: window.userId }) }]); } catch {} getCompanyBookings().then(({ data }) => setBookings(data || [])); }}><DeleteIcon /></IconButton>
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editing ? 'Edit Booking' : 'Add Booking'}</DialogTitle>
        <DialogContent>
          <TextField label="Passenger Name" value={form.passenger_name} onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))} fullWidth sx={{ mt: 1 }} />
          <TextField label="Seat Number" type="number" value={form.seat_number} onChange={e => setForm(f => ({ ...f, seat_number: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Booking Date" type="datetime-local" value={form.booking_date?.slice(0,16)} onChange={e => setForm(f => ({ ...f, booking_date: new Date(e.target.value).toISOString() }))} fullWidth sx={{ mt: 2 }} />
          <Select fullWidth value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="unpaid">Unpaid</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
          <Select fullWidth value={form.booking_source} onChange={e => setForm(f => ({ ...f, booking_source: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="app">App</MenuItem>
            <MenuItem value="web">Web</MenuItem>
            <MenuItem value="walk_in">Walk-in</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={actionsOpen} onClose={() => setActionsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Booking & Ticket Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Divider>Booking Information</Divider>
            <TextField label="Booking ID" value={editing?.booking_id || ''} fullWidth disabled />
            <TextField label="Passenger Full name" value={editing?.passenger_name || ''} fullWidth disabled />
            <TextField label="ID/Passport" value={actionsForm.id_passport} onChange={e => setActionsForm(f => ({ ...f, id_passport: e.target.value }))} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Phone" value={actionsForm.contact_phone || ''} onChange={e => setActionsForm(f => ({ ...f, contact_phone: e.target.value }))} fullWidth />
              <TextField label="Email" value={actionsForm.contact_email || ''} onChange={e => setActionsForm(f => ({ ...f, contact_email: e.target.value }))} fullWidth />
            </Stack>
            <TextField label="Nationality" value={actionsForm.nationality} onChange={e => setActionsForm(f => ({ ...f, nationality: e.target.value }))} fullWidth />

            <Divider>Journey details</Divider>
            <Select fullWidth value={actionsForm.route_id} onChange={e => setActionsForm(f => ({ ...f, route_id: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Route...</MenuItem>
              {routeOptions.map(r => <MenuItem key={r.route_id} value={r.route_id}>{`${r.origin} → ${r.destination}`}</MenuItem>)}
            </Select>
            <TextField label="Departure date & time" type="datetime-local" value={actionsForm.departure} onChange={e => setActionsForm(f => ({ ...f, departure: e.target.value }))} fullWidth />
            <TextField label="Arrival date & time" type="datetime-local" value={actionsForm.arrival} onChange={e => setActionsForm(f => ({ ...f, arrival: e.target.value }))} fullWidth />
            <Select fullWidth value={actionsForm.bus_id} onChange={e => setActionsForm(f => ({ ...f, bus_id: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Bus...</MenuItem>
              {busOptions.map(b => <MenuItem key={b.bus_id} value={b.bus_id}>{`${b.license_plate} (${b.capacity})`}</MenuItem>)}
            </Select>
            <TextField label="Seat number" value={editing?.seat_number || ''} fullWidth disabled />
            <TextField label="Booking status" value={actionsForm.status} onChange={e => setActionsForm(f => ({ ...f, status: e.target.value }))} fullWidth />

            <Divider>Ticket Information</Divider>
            <Stack direction="row" spacing={2}>
              <TextField label="Ticket Number" value={actionsForm.ticket_code} onChange={e => setActionsForm(f => ({ ...f, ticket_code: e.target.value }))} fullWidth />
              <Button onClick={() => setActionsForm(f => ({ ...f, ticket_code: f.ticket_code || `TKT-${Math.random().toString(36).slice(2,8).toUpperCase()}` }))}>Generate</Button>
            </Stack>
            <TextField label="Ticket type" value={actionsForm.ticket_type} onChange={e => setActionsForm(f => ({ ...f, ticket_type: e.target.value }))} fullWidth />
            <TextField label="Ticket issue date" type="datetime-local" value={actionsForm.ticket_issue_date} onChange={e => setActionsForm(f => ({ ...f, ticket_issue_date: e.target.value }))} fullWidth />

            <Divider>Payment Information</Divider>
            <TextField label="Payment ID (transaction_id)" value={actionsForm.transaction_id} onChange={e => setActionsForm(f => ({ ...f, transaction_id: e.target.value }))} fullWidth />
            <Select fullWidth value={actionsForm.payment_method} onChange={e => setActionsForm(f => ({ ...f, payment_method: e.target.value }))} displayEmpty>
              <MenuItem value="">Select Method...</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="Mobile Money">Mobile Money</MenuItem>
              <MenuItem value="PayPal">PayPal</MenuItem>
            </Select>
            <TextField label="Amount paid" type="number" value={actionsForm.amount} onChange={e => setActionsForm(f => ({ ...f, amount: e.target.value }))} fullWidth />
            <TextField label="Currency" value={actionsForm.currency} onChange={e => setActionsForm(f => ({ ...f, currency: e.target.value }))} fullWidth />
            <Select fullWidth value={actionsForm.payment_status} onChange={e => setActionsForm(f => ({ ...f, payment_status: e.target.value }))} displayEmpty>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
            <TextField label="Transaction ref" value={actionsForm.transaction_ref} onChange={e => setActionsForm(f => ({ ...f, transaction_ref: e.target.value }))} fullWidth />

            <Divider>Admin / Operations Info</Divider>
            <TextField label="Discount / Promo" value={actionsForm.discount} onChange={e => setActionsForm(f => ({ ...f, discount: e.target.value }))} fullWidth />
            <TextField label="Agent ID" value={actionsForm.created_by_agent_id} onChange={e => setActionsForm(f => ({ ...f, created_by_agent_id: e.target.value }))} fullWidth />
            <TextField label="Boarding point" value={actionsForm.origin_stop} onChange={e => setActionsForm(f => ({ ...f, origin_stop: e.target.value }))} fullWidth />
            <TextField label="Drop-off point" value={actionsForm.destination_stop} onChange={e => setActionsForm(f => ({ ...f, destination_stop: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveActions}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
