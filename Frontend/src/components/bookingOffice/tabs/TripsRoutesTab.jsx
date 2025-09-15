import React from 'react';
import { Grid } from '@mui/material';
import TripInfoTab from '../../tabs/TripInfoTab';
import RoutesTab from './RoutesTab';

export default function TripsRoutesTab() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TripInfoTab scope="booking_officer" />
      </Grid>
      <Grid item xs={12} md={6}>
        <RoutesTab />
      </Grid>
    </Grid>
  );
}
