import React from 'react';
import { Box, TextField, Button } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';

export default function SettingsTab() {
  return (
    <Box>
      <DashboardCard title="Dashboard Layout" variant="outlined">
        <div>Customize KPIs and widgets visibility.</div>
      </DashboardCard>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Notification Preferences" variant="outlined">
          <div>Email, SMS, and in-app settings.</div>
        </DashboardCard>
      </Box>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Service Templates" variant="outlined">
          <div>Create predefined maintenance workflows per bus type.</div>
        </DashboardCard>
      </Box>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Audit Trail" variant="outlined">
          <div>Track who updated tasks, inventory, or incidents.</div>
        </DashboardCard>
      </Box>
    </Box>
  );
}
