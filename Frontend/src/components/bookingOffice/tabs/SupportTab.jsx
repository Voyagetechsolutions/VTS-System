import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Divider, List, ListItem, ListItemText } from '@mui/material';
import { listSupportTickets, createSupportTicket, resolveSupportTicket } from '../../../supabase/api';

export default function SupportTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await listSupportTickets();
      setTickets(data || []);
    };
    loadData();
  }, []);

  const submit = async () => {
    if (!title || !message) return;
    await createSupportTicket(title, message);
    setTitle(''); setMessage('');
    const { data } = await listSupportTickets();
    setTickets(data || []);
  };

  const resolve = async (id) => { 
    await resolveSupportTicket(id); 
    const { data } = await listSupportTickets();
    setTickets(data || []);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Customer Support</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1} direction={{ xs: 'column', md: 'row' }}>
          <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <TextField label="Message" value={message} onChange={e => setMessage(e.target.value)} sx={{ minWidth: 360 }} />
          <Button variant="contained" onClick={submit}>Log</Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <List dense>
          {(tickets || []).map(t => (
            <ListItem key={t.id} secondaryAction={<Button size="small" onClick={() => resolve(t.id)}>Resolve</Button>}>
              <ListItemText primary={t.title} secondary={`${t.status} • ${new Date(t.created_at).toLocaleString()}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}


