import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Divider, List, ListItem, ListItemText } from '@mui/material';
import { getActivityLog } from '../../../supabase/api';
import { supabase } from '../../../supabase/client';

export default function ShiftSchedulingTab() {
  const [shifts, setShifts] = useState([]);
  const [who, setWho] = useState('');
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    const r = await getActivityLog({ types: ['shift'] });
    setShifts(r.data || []);
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);

  const create = async () => {
    if (!who || !when) return;
    const payload = { company_id: window.companyId, type: 'shift', message: JSON.stringify({ who, when, note }) };
    await supabase.from('activity_log').insert([payload]);
    setWho(''); setWhen(''); setNote('');
    load();
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Shift & Staff Scheduling</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Staff" value={who} onChange={e => setWho(e.target.value)} />
          <TextField label="Schedule (e.g., 2025-09-10 07:00-15:00)" value={when} onChange={e => setWhen(e.target.value)} fullWidth />
          <TextField label="Note" value={note} onChange={e => setNote(e.target.value)} />
          <Button variant="contained" onClick={create}>Assign</Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <List dense>
          {(shifts || []).map((s) => {
            let detail = ''; try { const m = JSON.parse(s.message || '{}'); detail = `${m.who || ''} • ${m.when || ''} • ${m.note || ''}`; } catch (error) { console.warn('Shift operation error:', error); }
            return <ListItem key={s.id}><ListItemText primary={detail || s.message} secondary={new Date(s.created_at).toLocaleString()} /></ListItem>;
          })}
        </List>
      </Paper>
    </Box>
  );
}


