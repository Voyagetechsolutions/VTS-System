import React from 'react';
import { Grid, Paper } from '@mui/material';
import FleetTab from './FleetTab';
import MaintenanceTab from './MaintenanceTab';

export default function FleetMaintenanceTab() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <FleetTab />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <MaintenanceTab />
        </Paper>
      </Grid>
    </Grid>
  );
}
