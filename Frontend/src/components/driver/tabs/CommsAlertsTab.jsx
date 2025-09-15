import React from 'react';
import { Grid } from '@mui/material';
import CommunicationsTab from '../../tabs/CommunicationsTab';
import NotificationsTab from '../../tabs/NotificationsTab';

export default function CommsAlertsTab() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><CommunicationsTab /></Grid>
      <Grid item xs={12} md={6}><NotificationsTab /></Grid>
    </Grid>
  );
}
