import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material';
import { supabase } from '../../../supabase/client';
import { listSupportTickets, createSupportTicket, resolveSupportTicket } from '../../../supabase/api';

export default function SupportTab() {
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '' });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = async () => {
    const t = await listSupportTickets();
    const { data: a } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setTickets(t.data || []);
    setAnnouncements(a || []);
  };
  useEffect(() => { load(); }, []);

  const createTicket = async () => {
    await createSupportTicket(form.title, form.message, 'normal');
    setDialogOpen(false);
    setForm({ title: '', message: '' });
    load();
  };
  const resolveTicket = async (id) => {
    await resolveSupportTicket(id);
    load();
  };

  const inRange = (d) => {
    const ts = d ? new Date(d).getTime() : null;
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() : null;
    if (ts == null) return true;
    if (fromTs != null && ts < fromTs) return false;
    if (toTs != null && ts > toTs) return false;
    return true;
  };
  const filtered = (tickets || []).filter(t => inRange(t.created_at));

  const exportCSV = () => {
    const rows = filtered;
    if (!rows?.length) return;
    const headers = ['id','title','status','priority','created_at'];
    const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'support_tickets.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flex: 1 }}>Support</Typography>
        <TextField size="small" label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <TextField size="small" label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <Button variant="outlined" onClick={exportCSV}>Export CSV</Button>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>Raise Ticket</Button>
      </Stack>
      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => resolveTicket(t.id)}>Resolve</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box mt={4}>
        <Typography variant="h6">Announcements</Typography>
        <Paper sx={{ p: 2 }}>
          {(announcements || []).map(a => (
            <Box key={a.id} sx={{ mb: 1 }}>
              <Typography variant="subtitle2">{a.title}</Typography>
              <Typography variant="body2">{a.message}</Typography>
            </Box>
          ))}
          {(!announcements || announcements.length === 0) && <Typography variant="body2">No announcements yet</Typography>}
        </Paper>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Raise Support Ticket</DialogTitle>
        <DialogContent>
          <TextField label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} fullWidth sx={{ mt: 1 }} />
          <TextField label="Message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} fullWidth multiline rows={4} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createTicket}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
