import React, { useEffect } from 'react';
import { Box } from '@mui/material';
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
      <Box className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {tabComponents[tab]}
      </Box>
    </SidebarLayout>
  );
}
