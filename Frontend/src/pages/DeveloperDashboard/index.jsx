import React from 'react';
import { Box } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import DevOverviewTab from '../../components/developer/tabs/DevOverviewTab';
import CompaniesDevTab from '../../components/developer/tabs/CompaniesDevTab';
import UsersDevTab from '../../components/developer/tabs/UsersDevTab';
import FleetRoutesDevTab from '../../components/developer/tabs/FleetRoutesDevTab';
import BookingsDevTab from '../../components/developer/tabs/BookingsDevTab';
import BillingDevTab from '../../components/developer/tabs/BillingDevTab';
import MonitoringDevTab from '../../components/developer/tabs/MonitoringDevTab';
import AnnouncementsDevTab from '../../components/developer/tabs/AnnouncementsDevTab';
import SettingsDevTab from '../../components/developer/tabs/SettingsDevTab';
import SupportDevTab from '../../components/developer/tabs/SupportDevTab';

const tabList = [
  { label: 'Overview', icon: 'dashboard' },
  { label: 'Companies', icon: 'business' },
  { label: 'Users', icon: 'users' },
  { label: 'Billing & Subscription', icon: 'revenue' },
  { label: 'Buses & Routes', icon: 'route' },
  { label: 'Bookings & Transactions', icon: 'bookings' },
  { label: 'Billing & Subscriptions', icon: 'revenue' },
  { label: 'Monitoring & Logs', icon: 'system' },
  { label: 'Announcements', icon: 'announcements' },
  { label: 'Settings', icon: 'settings' },
  { label: 'Support', icon: 'support' }
];

const tabComponents = [
  <DevOverviewTab />,
  <CompaniesDevTab />,
  <UsersDevTab />,
  <BillingDevTab />,
  <FleetRoutesDevTab />,
  <BookingsDevTab />,
  <BillingDevTab />,
  <MonitoringDevTab />,
  <AnnouncementsDevTab />,
  <SettingsDevTab />,
  <SupportDevTab />
];

export default function DeveloperDashboard() {
  const [tab, setTab] = React.useState(0);
  const navItems = tabList.map((item, idx) => ({ label: item.label, icon: item.icon, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Developer">
      <Box className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {tabComponents[tab]}
      </Box>
    </SidebarLayout>
  );
}
