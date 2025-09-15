import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { getAnnouncements } from '../../../supabase/api';

export default function TrainingTab() {
  const [notices, setNotices] = useState([]);
  useEffect(() => { getAnnouncements().then(res => setNotices(res.data || [])); }, []);
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Notices</Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {(notices||[]).map(n => (
            <Paper key={n.id} sx={{ p: 1 }}>
              <Typography>{n.title}</Typography>
              <Typography variant="body2" color="text.secondary">{n.message} • {n.date}</Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>
      {/* Training items can be pulled from a future table; showing notices only for now */}
    </Box>
  );
}


