import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, MenuItem, Select } from '@mui/material';
import { supabase } from '../../../supabase/client';
import { getCompanySettings } from '../../../supabase/api';

export default function CustomerTab() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [complaintsOpen, setComplaintsOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newComplaint, setNewComplaint] = useState({ details: '', severity: 'low' });
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ booking_id: '', amount: '', reason: '' });
  const [customerBookings, setCustomerBookings] = useState([]);
  const [canEdit, setCanEdit] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('customers').select('*').eq('company_id', window.companyId);
    setCustomers(data || []);
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);
  useEffect(() => { (async () => { try { const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole') || 'admin'; const { data } = await getCompanySettings(); setCanEdit(!!(data?.rbac?.[role]?.edit)); } catch { setCanEdit(true); } })(); }, []);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const openComplaints = async (customer) => {
    setSelectedCustomer(customer);
    const [{ data: comp }, { data: book }] = await Promise.all([
      supabase.from('customer_complaints').select('*').eq('company_id', window.companyId).eq('customer_id', customer.customer_id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('booking_id, amount, status, created_at').eq('company_id', window.companyId).eq('customer_id', customer.customer_id).order('created_at', { ascending: false })
    ]);
    setComplaints(comp || []);
    setCustomerBookings(book || []);
    setComplaintsOpen(true);
  };

  const addComplaint = async () => {
    if (!selectedCustomer) return;
    await supabase.from('customer_complaints').insert([{ company_id: window.companyId, customer_id: selectedCustomer.customer_id, details: newComplaint.details, severity: newComplaint.severity }]);
    setNewComplaint({ details: '', severity: 'low' });
    openComplaints(selectedCustomer);
  };

  const openRefund = async (customer) => {
    setSelectedCustomer(customer);
    const { data } = await supabase.from('bookings').select('booking_id, amount, status').eq('company_id', window.companyId).eq('customer_id', customer.customer_id).order('created_at', { ascending: false });
    setCustomerBookings(data || []);
    setRefundForm({ booking_id: data?.[0]?.booking_id || '', amount: data?.[0]?.amount || '', reason: '' });
    setRefundOpen(true);
  };

  const createRefund = async () => {
    const amt = Number(refundForm.amount || 0);
    if (!refundForm.booking_id || !amt) return;
    await supabase.from('refunds').insert([{ company_id: window.companyId, booking_id: refundForm.booking_id, amount: amt, reason: refundForm.reason || 'Customer refund', status: 'pending_approval' }]);
    setRefundOpen(false);
  };

  return (
    <>
      <TextField label="Search Customers" value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Bookings</TableCell>
            <TableCell>Complaints</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c) => (
            <TableRow key={c.customer_id}>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => openComplaints(c)}>View ({/* count via state on open */})</Button>
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => openComplaints(c)}>View</Button>
              </TableCell>
              <TableCell>
                <Button size="small" variant="outlined" onClick={() => openComplaints(c)}>Complaints</Button>
                {canEdit && <Button size="small" variant="contained" onClick={() => openRefund(c)} sx={{ ml: 1 }}>Issue Refund</Button>}
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

      {/* Complaints & Bookings Dialog */}
      <Dialog open={complaintsOpen} onClose={() => setComplaintsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCustomer ? `${selectedCustomer.name} — Bookings & Complaints` : 'Customer'}
        </DialogTitle>
        <DialogContent>
          <h4>Bookings</h4>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Booking</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(customerBookings||[]).map(b => (
                <TableRow key={b.booking_id}>
                  <TableCell>{b.booking_id}</TableCell>
                  <TableCell>{Number(b.amount||0).toLocaleString()}</TableCell>
                  <TableCell>{b.status}</TableCell>
                  <TableCell>{b.created_at ? new Date(b.created_at).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <h4 style={{ marginTop: 16 }}>Complaints</h4>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Details</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(complaints||[]).map(c => (
                <TableRow key={c.complaint_id}>
                  <TableCell>{c.details}</TableCell>
                  <TableCell>{c.severity}</TableCell>
                  <TableCell>{c.status}</TableCell>
                  <TableCell>{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <h4 style={{ marginTop: 16 }}>Add Complaint</h4>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField label="Details" fullWidth value={newComplaint.details} onChange={e => setNewComplaint(s => ({ ...s, details: e.target.value }))} />
            <Select value={newComplaint.severity} onChange={e => setNewComplaint(s => ({ ...s, severity: e.target.value }))}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
            {canEdit && <Button variant="contained" onClick={addComplaint}>Add</Button>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComplaintsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onClose={() => setRefundOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Refund (Pending Approval)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Select value={refundForm.booking_id} onChange={e => setRefundForm(f => ({ ...f, booking_id: e.target.value }))} fullWidth displayEmpty>
              <MenuItem value="">Select Booking...</MenuItem>
              {(customerBookings||[]).map(b => (
                <MenuItem key={b.booking_id} value={b.booking_id}>{b.booking_id} — ${Number(b.amount||0).toLocaleString()}</MenuItem>
              ))}
            </Select>
            <TextField label="Amount" type="number" value={refundForm.amount} onChange={e => setRefundForm(f => ({ ...f, amount: e.target.value }))} />
            <TextField label="Reason" value={refundForm.reason} onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundOpen(false)}>Cancel</Button>
          {canEdit && <Button variant="contained" onClick={createRefund}>Create</Button>}
        </DialogActions>
      </Dialog>
    </>
  );
}
