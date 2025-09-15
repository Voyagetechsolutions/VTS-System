import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody, TextField, Stack, Button } from '@mui/material';
import { getActivityLog } from '../../supabase/api';

export default function AuditTrailTab({ scope = 'admin' }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = async () => {
    const r = await getActivityLog();
    let list = r.data || [];
    if (scope !== 'admin') {
      // Basic client-side filtering example for Ops scope; backend/RLS would do real scoping
      list = list.filter(x => x.type !== 'billing' && x.type !== 'admin_only');
    }
    if (filter.trim()) {
      const f = filter.toLowerCase();
      list = list.filter(x => (x.type||'').toLowerCase().includes(f) || (x.message||'').toLowerCase().includes(f));
    }
    setRows(list);
  };
  useEffect(() => { load(); }, [filter]);

  const inRange = (d) => {
    const ts = d ? new Date(d).getTime() : null;
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() : null;
    if (ts == null) return true;
    if (fromTs != null && ts < fromTs) return false;
    if (toTs != null && ts > toTs) return false;
    return true;
  };

  const filtered = (rows || []).filter(r => inRange(r.created_at));

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['created_at','type','message'];
    const lines = [headers.join(',')].concat(filtered.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_trail.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Audit Trail</Typography>
        <TextField size="small" placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)} />
        <TextField size="small" label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <TextField size="small" label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <Button variant="outlined" onClick={exportCSV}>Export CSV</Button>
      </Stack>
      <Paper>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}


