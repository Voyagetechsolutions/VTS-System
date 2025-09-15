import React, { useEffect } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import CommandCenterTab from '../../components/depotManager/tabs/CommandCenterTab';
import OpsSupervisorTab from '../../components/depotManager/tabs/OpsSupervisorTab';
import DispatchTab from '../../components/depotManager/tabs/DispatchTab';
import FleetMaintenanceTab from '../../components/depotManager/tabs/FleetMaintenanceTab';
import InventoryTab from '../../components/depotManager/tabs/InventoryTab';
import FuelEnergyTab from '../../components/depotManager/tabs/FuelEnergyTab';
import StaffShiftTab from '../../components/depotManager/tabs/StaffShiftTab';
import ReportsTab from '../../components/depotManager/tabs/ReportsTab';
import NotificationsTab from '../../components/depotManager/tabs/NotificationsTab';
import SettingsTab from '../../components/depotManager/tabs/SettingsTab';

const tabList = [
  'Depot Command Center',
  'Operations Supervisor',
  'Dispatch / Trip Coordination',
  'Fleet & Maintenance Oversight',
  'Inventory & Warehouse',
  'Fuel & Energy',
  'Staff & Shift Management',
  'Reports & Analytics',
  'Notifications & Alerts',
  'Settings & Preferences',
];

const tabComponents = [
  <CommandCenterTab />,
  <OpsSupervisorTab />,
  <DispatchTab />,
  <FleetMaintenanceTab />,
  <InventoryTab />,
  <FuelEnergyTab />,
  <StaffShiftTab />,
  <ReportsTab />,
  <NotificationsTab />,
  <SettingsTab />,
];

export default function DepotManagerDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (role && role !== 'depot_manager') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((label, idx) => ({ label, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Depot Manager">
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 0.5, sm: 1 }, 
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': { opacity: 0.3 }
            }
          }}
        >
          {tabList.map((label) => <Tab key={label} label={label} />)}
        </Tabs>
      </Paper>
      <Box mt={{ xs: 1, sm: 2 }} className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {tabComponents[tab]}
      </Box>
    </SidebarLayout>
  );
}
