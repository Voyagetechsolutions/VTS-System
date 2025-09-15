import React, { useEffect } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import OverviewTab from '../../components/driver/tabs/OverviewTab';
import TripManagementTab from '../../components/driver/tabs/TripManagementTab';
import VehicleInfoTab from '../../components/driver/tabs/VehicleInfoTab';
import ShiftScheduleTab from '../../components/driver/tabs/ShiftScheduleTab';
import CommsAlertsTab from '../../components/driver/tabs/CommsAlertsTab';
import IncidentReportingTab from '../../components/driver/tabs/IncidentReportingTab';
import PerformanceTab from '../../components/driver/tabs/PerformanceTab';
import SettingsTab from '../../components/driver/tabs/SettingsTab';
import EarningsTab from '../../components/driver/tabs/EarningsTab';

const tabList = [
  'Driver Overview / Daily Dashboard',
  'Trip Details & Management',
  'Vehicle & Fleet Info',
  'Shift & Schedule',
  'Communication & Alerts',
  'Incident Reporting',
  'Performance & Feedback',
  'Earnings',
  'Settings & Preferences',
];

const tabComponents = [
  <OverviewTab />,
  <TripManagementTab />,
  <VehicleInfoTab />,
  <ShiftScheduleTab />,
  <CommsAlertsTab />,
  <IncidentReportingTab />,
  <PerformanceTab />,
  <EarningsTab />,
  <SettingsTab />,
];

export default function DriverDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (role && role !== 'driver') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((label, idx) => ({ label, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Driver">
      <Paper elevation={1} sx={{ p: 1, borderRadius: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {tabList.map((label) => <Tab key={label} label={label} />)}
        </Tabs>
      </Paper>
      <Box mt={2} className="fade-in">{tabComponents[tab]}</Box>
    </SidebarLayout>
  );
}


