import React from 'react';
import { Grid } from '@mui/material';
import BookingWizard from './BookingWizard';
import BookingsTab from './BookingsTab';

export default function BookingsHubTab() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <BookingWizard open onClose={()=>{}} />
      </Grid>
      <Grid item xs={12} md={7}>
        <BookingsTab />
      </Grid>
    </Grid>
  );
}
