import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import { supabase } from '../../../supabase/client';
import { updateCustomerLoyalty, blacklistCustomer, unblacklistCustomer, logLostFound, listLostFound } from '../../../supabase/api';

export default function PassengersTab() {
  const [passengers, setPassengers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [lostFound, setLostFound] = useState([]);

  const load = async () => {
    const { data } = await supabase.from('customers').select('id, name, email, phone, trips_completed, loyalty_points, is_blacklisted, assistance_notes').eq('company_id', window.companyId).order('name');
    setPassengers(data || []);
  };
  useEffect(() => { load(); (async ()=>{ const lf = await listLostFound(); setLostFound(lf.data || []); })(); }, []);

  const filtered = passengers.filter(p => (p.name||'').toLowerCase().includes(search.toLowerCase()) || (p.phone||'').toLowerCase().includes(search.toLowerCase()) || (p.email||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField label="Search Passengers" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" sx={{ mb: 2, ml: 2 }} onClick={() => setDialogOpen(true)}>Add Customer</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Trips Completed</TableCell>
            <TableCell>Loyalty</TableCell>
            <TableCell>Blacklist</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.email || '-'}</TableCell>
              <TableCell>{p.phone || '-'}</TableCell>
              <TableCell>{p.trips_completed || 0}</TableCell>
              <TableCell>{Number(p.loyalty_points||0).toFixed(0)}</TableCell>
              <TableCell>{p.is_blacklisted ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button size="small" onClick={async () => { await supabase.from('customers').update({ trips_completed: (p.trips_completed||0)+1 }).eq('id', p.id); load(); }}>Add Trip</Button>
                <Button size="small" sx={{ ml: 1 }} onClick={async () => { const pts = Number(prompt('Add loyalty points?')||0); if (!pts) return; await updateCustomerLoyalty(p.id, pts); load(); }}>Add Points</Button>
                {!p.is_blacklisted && <Button size="small" color="warning" sx={{ ml: 1 }} onClick={async () => { const reason = prompt('Blacklist reason'); await blacklistCustomer(p.id, reason); load(); }}>Blacklist</Button>}
                {p.is_blacklisted && <Button size="small" color="success" sx={{ ml: 1 }} onClick={async () => { await unblacklistCustomer(p.id); load(); }}>Unblacklist</Button>}
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
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mt: 1 }} />
          <TextField label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <TextField label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} fullWidth sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { await supabase.from('customers').insert([{ company_id: window.companyId, name: form.name, email: form.email, phone: form.phone }]); setDialogOpen(false); setForm({ name: '', email: '', phone: '' }); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Lost & Found</Typography>
        <Button size="small" variant="contained" sx={{ mb: 1 }} onClick={async () => { const booking_id = prompt('Booking ID (optional)')||null; const item = prompt('Item description'); if (!item) return; const contact = prompt('Contact (phone/email)')||''; await logLostFound({ booking_id, item_desc: item, contact }); const lf = await listLostFound(); setLostFound(lf.data||[]); }}>Log Item</Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Contact</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(lostFound||[]).map(it => (
              <TableRow key={it.id}>
                <TableCell>{new Date(it.created_at).toLocaleString()}</TableCell>
                <TableCell>{it.item_desc}</TableCell>
                <TableCell>{it.status}</TableCell>
                <TableCell>{it.contact || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}
