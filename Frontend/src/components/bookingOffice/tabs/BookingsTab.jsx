import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, Grid, Box, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { useSnackbar } from 'notistack';
import { supabase } from '../../../supabase/client';
import { getCompanyRoutes } from '../../../supabase/api';
import { subscribeToBookings } from '../../../supabase/realtime';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SeatMap from '../components/SeatMap';
let jsPDFLib = null;

export default function BookingsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [tripOptions, setTripOptions] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [form, setForm] = useState({ route_id: '', trip_id: '', date: '', seat_number: '', seats: [], passenger_name: '', phone: '', email: '', id_number: '', payment_method: 'cash', pickup: '', dropoff: '', is_return: false, return_date: '' });
  const [step, setStep] = useState(1);
  const [busMeta, setBusMeta] = useState({ capacity: 60, config: '2x2' });
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [resForm, setResForm] = useState({ booking_id: '', new_trip_id: '', new_seat: '' });
  const [customerMap, setCustomerMap] = useState(new Map());

  const load = async () => {
    const { data } = await supabase.from('bookings_with_company').select('*').eq('company_id', window.companyId).order('booking_date', { ascending: false });
    setBookings(data || []);
    const ids = Array.from(new Set((data||[]).map(b => b.customer_id).filter(Boolean)));
    if (ids.length) {
      const { data: custs } = await supabase.from('customers').select('id, email, phone, name').in('id', ids);
      const map = new Map((custs||[]).map(c => [c.id, c]));
      setCustomerMap(map);
    } else {
      setCustomerMap(new Map());
    }
    const r = await getCompanyRoutes();
    setRoutes(r.data || []);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const sub = subscribeToBookings(() => load());
    return () => { try { sub.unsubscribe?.(); } catch (error) { console.warn('Subscription cleanup error:', error); } };
  }, []);

  const onRouteChange = async (route_id) => {
    setForm(f => ({ ...f, route_id, trip_id: '', seat_number: '', date: '' }));
    const { data } = await supabase.from('trips_with_company').select('*').eq('company_id', window.companyId).eq('route_id', route_id).order('date', { ascending: true });
    setTripOptions(data || []);
  };
  const onTripChange = async (trip_id) => {
    setForm(f => ({ ...f, trip_id, seat_number: '', seats: [] }));
    const [{ data: seats }, { data: tripRow }] = await Promise.all([
      supabase.rpc('get_available_seats', { p_trip_id: trip_id }),
      supabase.from('trips').select('bus_id').eq('trip_id', trip_id).single(),
    ]);
    const bus = tripRow?.bus_id ? await supabase.from('buses').select('capacity, config').eq('bus_id', tripRow.bus_id).single() : { data: null };
    if (bus?.data) setBusMeta({ capacity: bus.data.capacity || 60, config: bus.data.config || '2x2' });
    setAvailableSeats((seats || []).map(x => x.seat_number));
  };
  const searchCustomers = async (q) => {
    setCustomerQuery(q);
    if (!q || q.length < 2) { setCustomerResults([]); return; }
    const { data } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('company_id', window.companyId)
      .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(10);
    setCustomerResults(data || []);
  };
  const chooseCustomer = (c) => {
    setForm(f => ({ ...f, passenger_name: c.name || '', phone: c.phone || '', email: c.email || '' }));
    setCustomerQuery('');
    setCustomerResults([]);
  };
  const create = async () => {
    const trip_id = form.trip_id;
    for (const seat of (form.seats.length ? form.seats : [form.seat_number])) {
      await supabase.rpc('create_booking', {
        p_trip_id: trip_id,
        p_company_id: window.companyId,
        p_passenger_name: form.passenger_name,
        p_phone: form.phone,
        p_id_number: form.id_number,
        p_seat_number: Number(seat),
        p_payment_status: 'unpaid',
        p_source: 'desk'
      });
    }
    setStep(1);
    setDialogOpen(false);
    setForm({ route_id: '', trip_id: '', date: '', seat_number: '', seats: [], passenger_name: '', phone: '', id_number: '', payment_method: 'cash', pickup: '', dropoff: '', is_return: false, return_date: '' });
    load();
  };
  const cancel = async (booking_id) => {
    await supabase.rpc('cancel_booking', { p_booking_id: booking_id, p_reason: 'Cancelled by agent' });
    load();
  };
  const refund = async (booking_id) => {
    // keep refunds available under Refunds tab; remove from quick actions here if needed
    await supabase.from('payments').insert([{ booking_id, amount: 0, payment_method: 'refund', paid_at: new Date().toISOString(), status: 'paid' }]);
    load();
  };
  const openReschedule = async (b) => {
    setResForm({ booking_id: b.booking_id, new_trip_id: '', new_seat: '' });
    const { data } = await supabase.from('trips_with_company').select('*').eq('company_id', window.companyId).eq('route_id', b.route_id || '').order('date', { ascending: true });
    setTripOptions(data || []);
    setRescheduleOpen(true);
  };
  const onResTripChange = async (trip_id) => {
    setResForm(f => ({ ...f, new_trip_id: trip_id, new_seat: '' }));
    const { data } = await supabase.rpc('get_available_seats', { p_trip_id: trip_id });
    setAvailableSeats((data || []).map(x => x.seat_number));
  };
  const doReschedule = async () => {
    await supabase.rpc('reschedule_booking', { p_booking_id: resForm.booking_id, p_new_trip_id: resForm.new_trip_id, p_new_seat: Number(resForm.new_seat) });
    setRescheduleOpen(false);
    setResForm({ booking_id: '', new_trip_id: '', new_seat: '' });
    load();
  };

  const ensureJsPDF = async () => {
    if (!jsPDFLib) {
      jsPDFLib = (await import('jspdf')).default;
    }
    return jsPDFLib;
  };
  const generateTicketPdfBase64 = async (b) => {
    const jsPDF = await ensureJsPDF();
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Bus Ticket', 20, 20);
    doc.setFontSize(10);
    doc.text(`Booking: ${b.booking_id}`, 20, 30);
    doc.text(`Passenger: ${b.passenger_name}`, 20, 36);
    doc.text(`Seat: ${b.seat_number}`, 20, 42);
    doc.text(`Date: ${new Date(b.booking_date).toLocaleString()}`, 20, 48);
    return btoa(doc.output('arraybuffer'));
  };
  const downloadTicket = async (b) => {
    const jsPDF = await ensureJsPDF();
    await generateTicketPdfBase64(b);
    const doc = new jsPDF();
    // regenerate quickly for download
    doc.setFontSize(14);
    doc.text('Bus Ticket', 20, 20);
    doc.setFontSize(10);
    doc.text(`Booking: ${b.booking_id}`, 20, 30);
    doc.text(`Passenger: ${b.passenger_name}`, 20, 36);
    doc.text(`Seat: ${b.seat_number}`, 20, 42);
    doc.text(`Date: ${new Date(b.booking_date).toLocaleString()}`, 20, 48);
    doc.save(`ticket-${b.booking_id}.pdf`);
  };
  const emailTicket = async (b, email) => {
    const base64 = await generateTicketPdfBase64(b);
    const { sendEmailTicket } = await import('../../../supabase/api');
    const res = await sendEmailTicket(b.booking_id, email, base64);
    if (!res?.error) enqueueSnackbar('Ticket email sent (or queued).', { variant: 'success' }); else enqueueSnackbar('Failed to send email', { variant: 'error' });
  };

  const filtered = bookings.filter(b => b.passenger_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField label="Search Bookings" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Passenger Name</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Seat</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => (
            <TableRow key={b.booking_id}>
              <TableCell>{b.passenger_name}</TableCell>
              <TableCell>{b.route_id || '-'}</TableCell>
              <TableCell>{new Date(b.booking_date).toLocaleDateString()}</TableCell>
              <TableCell>{b.seat_number}</TableCell>
              <TableCell>{b.status}</TableCell>
              <TableCell>
                <IconButton onClick={() => openReschedule(b)}><EditIcon /></IconButton>
                <IconButton><DeleteIcon /></IconButton>
                <Button size="small" color="error" onClick={() => cancel(b.booking_id)}>Cancel</Button>
                <Button size="small" color="secondary" onClick={() => refund(b.booking_id)}>Refund</Button>
                <Button size="small" onClick={() => downloadTicket(b)}>Download Ticket</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)}>
        <DialogTitle>Reschedule Booking</DialogTitle>
        <DialogContent>
          <Select fullWidth value={resForm.new_trip_id} onChange={e => onResTripChange(e.target.value)} sx={{ mt: 1 }} displayEmpty>
            <MenuItem value="">Select New Trip...</MenuItem>
            {(tripOptions||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.date} {t.departure_time}</MenuItem>)}
          </Select>
          <Select fullWidth value={resForm.new_seat} onChange={e => setResForm(f => ({ ...f, new_seat: e.target.value }))} sx={{ mt: 2 }} displayEmpty>
            <MenuItem value="">Select Seat...</MenuItem>
            {(availableSeats||[]).map(s => <MenuItem key={s} value={s}>Seat {s}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={doReschedule} disabled={!resForm.new_trip_id || !resForm.new_seat}>Reschedule</Button>
        </DialogActions>
      </Dialog>
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
      />

      <Dialog open={dialogOpen} onClose={() => { setStep(1); setDialogOpen(false); }} maxWidth="md" fullWidth>
        <DialogTitle>New Booking</DialogTitle>
        <DialogContent>
          {step === 1 && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Select fullWidth value={form.route_id} onChange={e => onRouteChange(e.target.value)} displayEmpty>
                    <MenuItem value="">Select Route...</MenuItem>
                    {(routes||[]).map(r => <MenuItem key={r.route_id} value={r.route_id}>{r.origin} - {r.destination}</MenuItem>)}
                  </Select>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Select fullWidth value={form.trip_id} onChange={e => onTripChange(e.target.value)} displayEmpty>
                    <MenuItem value="">Select Trip...</MenuItem>
                    {(tripOptions||[]).map(t => <MenuItem key={t.trip_id} value={t.trip_id}>{t.date} {t.departure_time}</MenuItem>)}
                  </Select>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Pickup" placeholder="-- Please Select --" fullWidth value={form.pickup} onChange={e => setForm(f => ({ ...f, pickup: e.target.value }))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Drop-Off" placeholder="-- Select a pickup location --" fullWidth value={form.dropoff} onChange={e => setForm(f => ({ ...f, dropoff: e.target.value }))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Pickup Date" type="date" fullWidth value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel control={<Checkbox checked={form.is_return} onChange={e => setForm(f => ({ ...f, is_return: e.target.checked }))} />} label="Return" />
                  {form.is_return && <TextField label="Return Date" type="date" fullWidth value={form.return_date} onChange={e => setForm(f => ({ ...f, return_date: e.target.value }))} />}
                </Grid>
              </Grid>
              <Box mt={2}><Button variant="contained" disabled={!form.trip_id} onClick={() => setStep(2)}>Next</Button></Box>
            </Box>
          )}
          {step === 2 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Seat Selection</Typography>
              <SeatMap capacity={busMeta.capacity} config={busMeta.config} taken={availableSeats.filter(s => !availableSeats.includes(s))} selected={form.seats} onToggle={(n) => setForm(f => ({ ...f, seats: f.seats.includes(n) ? f.seats.filter(x => x !== n) : [...f.seats, n] }))} />
              <Box mt={2}><Button onClick={() => setStep(1)}>Back</Button><Button sx={{ ml: 1 }} variant="contained" disabled={(form.seats||[]).length === 0} onClick={() => setStep(3)}>Next</Button></Box>
            </Box>
          )}
          {step === 3 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Passenger Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField label="Search Customer (name/email/phone)" value={customerQuery} onChange={e => searchCustomers(e.target.value)} fullWidth />
                  {customerResults.length > 0 && (
                    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1, mt: 1 }}>
                      {customerResults.map(c => (
                        <Box key={c.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                          <span>{c.name} · {c.phone || c.email}</span>
                          <Button size="small" onClick={() => chooseCustomer(c)}>Use</Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={3}><Select fullWidth defaultValue="adult"><MenuItem value="adult">Adult</MenuItem><MenuItem value="child">Child (under 12)</MenuItem></Select></Grid>
                <Grid item xs={12} md={3}><Select fullWidth defaultValue="Mr"><MenuItem value="Mr">Mr</MenuItem><MenuItem value="Ms">Ms</MenuItem><MenuItem value="Mrs">Mrs</MenuItem></Select></Grid>
                <Grid item xs={12} md={3}><TextField label="First Name" fullWidth /></Grid>
                <Grid item xs={12} md={3}><TextField label="Last Name" fullWidth /></Grid>
                <Grid item xs={12} md={3}><Select fullWidth defaultValue="male"><MenuItem value="male">Male</MenuItem><MenuItem value="female">Female</MenuItem></Select></Grid>
                <Grid item xs={12} md={3}><Select fullWidth defaultValue="passport"><MenuItem value="passport">Passport</MenuItem><MenuItem value="id">ID</MenuItem><MenuItem value="drivers">Driver's License</MenuItem></Select></Grid>
                <Grid item xs={12} md={3}><TextField label="Identity Number" value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} fullWidth /></Grid>
                <Grid item xs={12} md={3}><TextField label="Date of Birth" type="date" fullWidth /></Grid>
                <Grid item xs={12} md={3}><TextField label="Nationality" fullWidth /></Grid>
                <Grid item xs={12} md={3}><TextField label="Email Address" fullWidth /></Grid>
                <Grid item xs={12} md={3}><TextField label="Cellphone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} fullWidth /></Grid>
                <Grid item xs={12} md={3}><TextField label="Emergency Contact" fullWidth /></Grid>
                <Grid item xs={12} md={3}><TextField label="Emergency Contact Number" fullWidth /></Grid>
              </Grid>
              <Box mt={2}><Button onClick={() => setStep(2)}>Back</Button><Button sx={{ ml: 1 }} variant="contained" onClick={() => setStep(4)}>Next</Button></Box>
            </Box>
          )}
          {step === 4 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Confirm & Ticket</Typography>
              <Select fullWidth value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} sx={{ mb: 2 }}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                <MenuItem value="voucher">Voucher</MenuItem>
              </Select>
              <Box display="flex" gap={1}>
                <Button variant="contained" onClick={create}>Confirm Ticket</Button>
                <Button onClick={async () => { await ensureJsPDF(); window.print(); }}>Print Ticket</Button>
                <Button onClick={async () => { const guessed = form?.email || (customerMap.get(bookings[0]?.customer_id)?.email) || window.user?.email || ''; const promptEmail = prompt('Send to email:', guessed); if (promptEmail) await emailTicket(bookings[0], promptEmail); }}>Email Ticket</Button>
                <Button onClick={async () => { if (bookings[0]) await downloadTicket(bookings[0]); }}>Download Ticket</Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setStep(1); setDialogOpen(false); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
