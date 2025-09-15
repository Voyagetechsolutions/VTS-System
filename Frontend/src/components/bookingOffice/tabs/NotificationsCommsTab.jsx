import React from 'react';
import { Grid } from '@mui/material';
import NotificationsTab from './NotificationsTab';
import CommunicationsTab from '../../tabs/CommunicationsTab';

export default function NotificationsCommsTab() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <NotificationsTab />
      </Grid>
      <Grid item xs={12} md={6}>
        <CommunicationsTab />
      </Grid>
    </Grid>
  );
}
