import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody, TextField, Stack, Button, Select, MenuItem } from '@mui/material';
import { getActivityLog } from '../../supabase/api';

export default function AuditTrailTab({ scope = 'admin' }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [limit, setLimit] = useState(200);

  const load = async () => {
    const r = await getActivityLog({ limit });
    let list = r.data || [];
    if (scope !== 'admin') {
      // Basic client-side filtering example for Ops scope; backend/RLS would do real scoping
      list = list.filter(x => x.type !== 'billing' && x.type !== 'admin_only');
    }
    setRows(list);
  };
  useEffect(() => { load(); }, [limit]);

  const inRange = (d) => {
    const ts = d ? new Date(d).getTime() : null;
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() : null;
    if (ts == null) return true;
    if (fromTs != null && ts < fromTs) return false;
    if (toTs != null && ts > toTs) return false;
    return true;
  };

  const types = useMemo(() => Array.from(new Set((rows||[]).map(r => r.type).filter(Boolean))), [rows]);
  const filtered = (rows || [])
    .filter(r => inRange(r.created_at))
    .filter(r => !typeFilter ? true : r.type === typeFilter)
    .filter(r => {
      if (!filter.trim()) return true;
      const f = filter.toLowerCase();
      return (r.type||'').toLowerCase().includes(f) || (r.message||'').toLowerCase().includes(f);
    });

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

  const printPDF = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const html = `<!doctype html><html><head><title>Audit Trail</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
        th { background: #f5f5f5; }
      </style>
    </head><body>
      <h2>Audit Trail</h2>
      <table>
        <thead><tr><th>Time</th><th>Type</th><th>Message</th></tr></thead>
        <tbody>
          ${filtered.map(r => `<tr><td>${new Date(r.created_at).toLocaleString()}</td><td>${r.type||''}</td><td>${(r.message||'').replace(/</g,'&lt;')}</td></tr>`).join('')}
        </tbody>
      </table>
    </body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Audit Trail</Typography>
        <TextField size="small" placeholder="Keyword..." value={filter} onChange={e => setFilter(e.target.value)} />
        <Select size="small" displayEmpty value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="">All Types</MenuItem>
          {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </Select>
        <TextField size="small" label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <TextField size="small" label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <Select size="small" value={limit} onChange={e => setLimit(Number(e.target.value))}>
          <MenuItem value={50}>Last 50</MenuItem>
          <MenuItem value={100}>Last 100</MenuItem>
          <MenuItem value={200}>Last 200</MenuItem>
          <MenuItem value={500}>Last 500</MenuItem>
        </Select>
        <Button variant="outlined" onClick={exportCSV}>Export CSV</Button>
        <Button variant="outlined" onClick={printPDF}>Print/PDF</Button>
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


