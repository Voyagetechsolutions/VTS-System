import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container } from '@mui/material';

export default function AppShell({ title = 'Bus Management', children }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Bus Management</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>Developer</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {title && (
          <Typography variant="h4" className="section-title" gutterBottom>
            {title}
          </Typography>
        )}
        {children}
      </Container>
    </Box>
  );
}


