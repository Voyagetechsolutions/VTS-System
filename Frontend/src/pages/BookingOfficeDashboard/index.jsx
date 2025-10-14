import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import CommandCenterTab from '../../components/bookingOffice/tabs/CommandCenterTab';
import BookingsHubTab from '../../components/bookingOffice/tabs/BookingsHubTab';
import CheckInBoardingTab from '../../components/bookingOffice/tabs/CheckInBoardingTab';
import RefundsTab from '../../components/bookingOffice/tabs/RefundsTab';
import PassengersTab from '../../components/bookingOffice/tabs/PassengersTab';
import PaymentsTab from '../../components/bookingOffice/tabs/PaymentsTab';
import TripsRoutesTab from '../../components/bookingOffice/tabs/TripsRoutesTab';
import ReportsTab from '../../components/bookingOffice/tabs/ReportsTab';
import NotificationsCommsTab from '../../components/bookingOffice/tabs/NotificationsCommsTab';
import SupportKnowledgeTab from '../../components/bookingOffice/tabs/SupportKnowledgeTab';
import SettingsTab from '../../components/bookingOffice/tabs/SettingsTab';

const tabList = [
  'Booking Command Center',
  'Bookings Hub',
  'Check-in & Boarding',
  'Refunds & Cancellations',
  'Passengers (Mini-CRM)',
  'Payments & Transactions',
  'Trips & Routes',
  'Reports & Analytics',
  'Notifications & Communications',
  'Support & Knowledge Base',
  'Settings & Preferences',
];

const tabComponents = [
  <CommandCenterTab />,
  <BookingsHubTab />,
  <CheckInBoardingTab />,
  <RefundsTab />,
  <PassengersTab />,
  <PaymentsTab />,
  <TripsRoutesTab />,
  <ReportsTab />,
  <NotificationsCommsTab />,
  <SupportKnowledgeTab />,
  <SettingsTab />,
];

export default function BookingOfficeDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (!role || role !== 'booking_officer') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((label, idx) => ({ label, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Booking Office">
      <Box className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {tabComponents[tab]}
      </Box>
    </SidebarLayout>
  );
}
