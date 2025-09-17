import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import CommandCenterTab from '../../components/maintenanceManager/tabs/CommandCenterTab';
import StaffRBACTab from '../../components/maintenanceManager/tabs/StaffRBACTab';
import TasksWorkflowTab from '../../components/maintenanceManager/tabs/TasksWorkflowTab';
import FleetHealthTab from '../../components/maintenanceManager/tabs/FleetHealthTab';
import InventoryTab from '../../components/maintenanceManager/tabs/InventoryTab';
import IncidentsQCTab from '../../components/maintenanceManager/tabs/IncidentsQCTab';
import ReportsTab from '../../components/maintenanceManager/tabs/ReportsTab';
import NotificationsTab from '../../components/maintenanceManager/tabs/NotificationsTab';
import SettingsTab from '../../components/maintenanceManager/tabs/SettingsTab';

const tabList = [
  'Dashboard Overview',
  'Staff Management & RBAC',
  'Maintenance Tasks & Workflow',
  'Fleet Health & Predictive',
  'Inventory & Parts',
  'Incidents & Quality Control',
  'Reports & Analytics',
  'Notifications & Alerts',
  'Settings & Customization',
];

const tabComponents = [
  <CommandCenterTab />,
  <StaffRBACTab />,
  <TasksWorkflowTab />,
  <FleetHealthTab />,
  <InventoryTab />,
  <IncidentsQCTab />,
  <ReportsTab />,
  <NotificationsTab />,
  <SettingsTab />,
];

export default function MaintenanceManagerDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (role && role !== 'maintenance_manager') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((label, idx) => ({ label, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Maintenance Manager">
      <Box className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {tabComponents[tab]}
      </Box>
    </SidebarLayout>
  );
}
