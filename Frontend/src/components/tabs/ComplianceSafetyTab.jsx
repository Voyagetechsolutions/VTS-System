import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody, Stack, TextField, Button, List, ListItem, ListItemText } from '@mui/material';
import { supabase } from '../../supabase/client';
import { getIncidents } from '../../supabase/api';
import { subscribeToIncidents } from '../../supabase/realtime';

export default function ComplianceSafetyTab() {
  const [rows, setRows] = useState([]);
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({ category: '', title: '', details: '' });
  useEffect(() => { getIncidents().then(r => setRows(r.data || [])); }, []);
  useEffect(() => {
    const sub = subscribeToIncidents(() => getIncidents().then(r => setRows(r.data || [])));
    return () => { try { sub.unsubscribe?.(); } catch {} };
  }, []);
  useEffect(() => { (async ()=>{ try { const { data } = await supabase.from('compliance_rules').select('*').eq('company_id', window.companyId).order('created_at', { ascending: false }); setRules(data||[]); } catch {} })(); }, []);
  const addRule = async () => { if (!form.category || !form.title) return; await supabase.from('compliance_rules').insert([{ company_id: window.companyId, category: form.category, title: form.title, details: form.details }]); const { data } = await supabase.from('compliance_rules').select('*').eq('company_id', window.companyId).order('created_at', { ascending: false }); setRules(data||[]); setForm({ category: '', title: '', details: '' }); };
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Compliance & Safety Logs</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Compliance Rules</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
          <TextField label="Category" placeholder="Vehicle/Driver/Insurance/Health/Passenger/Emergency" value={form.category} onChange={e=>setForm(f=>({...f, category: e.target.value}))} />
          <TextField label="Title" placeholder="e.g., Valid roadworthy certificate" value={form.title} onChange={e=>setForm(f=>({...f, title: e.target.value}))} />
          <TextField label="Details" placeholder="Extra notes" value={form.details} onChange={e=>setForm(f=>({...f, details: e.target.value}))} fullWidth />
          <Button variant="contained" onClick={addRule}>Add Rule</Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <List dense>
          {(rules||[]).map(r => (
            <ListItem key={r.id}>
              <ListItemText primary={`${r.category}: ${r.title}`} secondary={r.details} />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Paper>
        <Divider />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reported</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows || []).map(r => (
              <TableRow key={r.incident_id}>
                <TableCell>{r.incident_id}</TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{new Date(r.reported_at || r.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}


