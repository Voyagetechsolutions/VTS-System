import React from 'react';
import { Grid } from '@mui/material';
import FleetTab from './FleetTab';
import MaintenanceTab from './MaintenanceTab';

export default function FleetMaintenanceTab() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <FleetTab />
      </Grid>
      <Grid item xs={12} md={6}>
        <MaintenanceTab />
      </Grid>
    </Grid>
  );
}
