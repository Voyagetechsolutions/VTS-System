import React, { useEffect } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import CommandCenterTab from '../../components/boardingOperator/tabs/CommandCenterTab';
import TripBoardingManagementTab from '../../components/boardingOperator/tabs/TripBoardingManagementTab';
import RealtimeUpdatesAlertsTab from '../../components/boardingOperator/tabs/RealtimeUpdatesAlertsTab';
import IncidentExceptionTab from '../../components/boardingOperator/tabs/IncidentExceptionTab';
import SeatManagementTab from '../../components/boardingOperator/tabs/SeatManagementTab';
import ShiftSummaryTab from '../../components/boardingOperator/tabs/ShiftSummaryTab';
import NotificationsCommsTab from '../../components/boardingOperator/tabs/NotificationsCommsTab';
import SettingsTab from '../../components/boardingOperator/tabs/SettingsTab';

const tabList = [
  'Live Boarding Overview',
  'Trip & Boarding Management',
  'Real-Time Updates & Alerts',
  'Incident & Exception Reporting',
  'Seat Management',
  'Shift Summary / Reports',
  'Notifications & Communications',
  'Settings & Preferences',
];

const tabComponents = [
  <CommandCenterTab />,           // 1
  <TripBoardingManagementTab />,  // 2
  <RealtimeUpdatesAlertsTab />,   // 3
  <IncidentExceptionTab />,       // 4
  <SeatManagementTab />,          // 5
  <ShiftSummaryTab />,            // 6
  <NotificationsCommsTab />,      // 7
  <SettingsTab />,                // 8
];

export default function BoardingOperatorDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (role && role !== 'boarding_operator') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((label, idx) => ({ label, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Boarding Operator">
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
