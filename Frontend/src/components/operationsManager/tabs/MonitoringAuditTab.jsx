import React from 'react';
import { Grid } from '@mui/material';
import NotificationsTab from '../../tabs/NotificationsTab';
import AuditTrailTab from '../../tabs/AuditTrailTab';

export default function MonitoringAuditTab() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <NotificationsTab />
      </Grid>
      <Grid item xs={12} md={6}>
        <AuditTrailTab scope="ops" />
      </Grid>
    </Grid>
  );
}
