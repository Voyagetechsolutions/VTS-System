import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { getMessages, sendMessage } from '../../../supabase/api';
import { subscribeToMessages } from '../../../supabase/realtime';

export default function MessagesTab() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const boxRef = useRef(null);

  const load = async () => {
    const res = await getMessages();
    setMessages(res.data || []);
    setTimeout(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, 50);
  };
  useEffect(() => {
    load();
    const sub = subscribeToMessages(() => load());
    return () => { try { sub.unsubscribe(); } catch {} };
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    await sendMessage(text);
    setText('');
    load();
  };

  return (
    <Box>
      <Paper ref={boxRef} sx={{ p: 2, height: 320, overflowY: 'auto' }}>
        <Stack spacing={1}>
          {(messages||[]).map((m, idx) => (
            <Box key={idx} sx={{ textAlign: m.sender === 'driver' ? 'right' : 'left' }}>
              <Typography variant="caption" color="text.secondary">{m.created_at}</Typography>
              <Typography variant="body2">{m.message}</Typography>
            </Box>
          ))}
          {messages.length === 0 && <Typography variant="body2" color="text.secondary">No messages.</Typography>}
        </Stack>
      </Paper>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <TextField fullWidth size="small" placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} />
        <Button variant="contained" onClick={send}>Send</Button>
      </Stack>
    </Box>
  );
}


