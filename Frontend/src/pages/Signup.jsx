import React from 'react';
import { Box, Paper, Typography, Button, Stack, Link as MLink } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
      <Paper sx={{ width: 520, maxWidth: '94vw', p: 4, boxShadow: 4 }} elevation={3}>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>Sign up</Typography>
          <Typography variant="body2" color="text.secondary">
            Please contact your company admin to add you to the system or contact the developer at
            {' '}<MLink href="mailto:voyagetechsolutions@gmail.com">voyagetechsolutions@gmail.com</MLink>{' '}for more information.
          </Typography>
        </Stack>
        <Button variant="contained" color="primary" fullWidth onClick={() => navigate('/')}>Back to Login</Button>
      </Paper>
    </Box>
  );
}
