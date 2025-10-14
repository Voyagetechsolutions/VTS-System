import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Divider, List, ListItem, ListItemText, Select, MenuItem } from '@mui/material';
import { getMessages, sendMessage, getAnnouncements, createAnnouncement } from '../../supabase/api';
import { subscribeToMessages, subscribeToAnnouncements } from '../../supabase/realtime';

export default function CommunicationsTab() {
  const [messages, setMessages] = useState([]);
  const [ann, setAnn] = useState([]);
  const [text, setText] = useState('');
  const [target, setTarget] = useState({ type: 'roles', value: 'all' });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const load = async () => {
    const [m, a] = await Promise.all([getMessages(), getAnnouncements()]);
    setMessages(m.data || []);
    setAnn(a.data || []);
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);
  useEffect(() => {
    const subs = [
      subscribeToMessages(load),
      subscribeToAnnouncements(load)
    ];
    return () => { subs.forEach(s => { try { s.unsubscribe?.(); } catch (error) { console.warn('Subscription cleanup error:', error); } }); };
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    await sendMessage(text.trim(), target);
    setText('');
    load();
  };

  const announce = async () => {
    if (!title.trim() || !body.trim()) return;
    await createAnnouncement(title.trim(), body.trim());
    setTitle(''); setBody('');
    load();
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Communications</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1">Messages</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Select size="small" value={target.type} onChange={e => setTarget(t => ({ ...t, type: e.target.value }))}>
              <MenuItem value="roles">Roles</MenuItem>
              <MenuItem value="passenger">Passenger</MenuItem>
            </Select>
            <TextField size="small" placeholder={target.type === 'roles' ? 'role (e.g., driver, admin) or all' : 'passenger id/email'} value={target.value} onChange={e => setTarget(t => ({ ...t, value: e.target.value }))} />
            <TextField fullWidth size="small" value={text} onChange={e => setText(e.target.value)} placeholder="Message..." />
            <Button variant="contained" onClick={send}>Send</Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <List dense>
            {(messages || []).map((m, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={m.message} secondary={m.created_at || m.sender} />
              </ListItem>
            ))}
          </List>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1">Announcements</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <TextField size="small" label="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <TextField size="small" multiline minRows={2} label="Message" value={body} onChange={e => setBody(e.target.value)} />
            <Button variant="outlined" onClick={announce}>Post</Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <List dense>
            {(ann || []).map((a) => (
              <ListItem key={a.id}>
                <ListItemText primary={a.title} secondary={a.message} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Stack>
    </Box>
  );
}


