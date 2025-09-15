import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { alertOperations } from '../../../supabase/api';

export default function SupportTab() {
  const [message, setMessage] = useState('');
  const send = async () => {
    await alertOperations(message || 'Driver needs assistance');
    setMessage('');
    alert('Alert sent to Operations');
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Emergency / Support</Typography>
      <TextField label="Message" value={message} onChange={e => setMessage(e.target.value)} fullWidth multiline rows={3} sx={{ mt: 1 }} />
      <Button variant="contained" color="error" onClick={send} sx={{ mt: 2 }}>Alert Operations</Button>
    </Box>
  );
}


