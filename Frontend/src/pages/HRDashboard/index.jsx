import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import ProfilesTab from '../../components/hr/tabs/ProfilesTab';
import AttendanceTab from '../../components/hr/tabs/AttendanceTab';
import PayrollTab from '../../components/hr/tabs/PayrollTab';
import TrainingTab from '../../components/hr/tabs/TrainingTab';
import ReportsTab from '../../components/hr/tabs/ReportsTab';
import NotificationsTab from '../../components/hr/tabs/NotificationsTab';
import SettingsTab from '../../components/hr/tabs/SettingsTab';
import HROverviewTab from '../../components/hr/tabs/HROverviewTab';
import LeavesTab from '../../components/hr/tabs/LeavesTab';
import ShiftsTab from '../../components/hr/tabs/ShiftsTab';
import RecruitmentTab from '../../components/hr/tabs/RecruitmentTab';
import PerformanceTab from '../../components/hr/tabs/PerformanceTab';
import ComplianceTab from '../../components/hr/tabs/ComplianceTab';

const tabList = [
  'HR Overview',
  'Staff Profiles & Roles',
  'Attendance & Shift Scheduling',
  'Shifts',
  'Payroll & Compensation',
  'Leaves & Absences',
  'Training & Certification',
  'Recruitment & Onboarding',
  'Performance Management',
  'Compliance & Safety',
  'Reports & Analytics',
  'Notifications & Alerts',
  'Settings',
];

const tabComponents = [
  <HROverviewTab />,
  <ProfilesTab />,
  <AttendanceTab />,
  <ShiftsTab />,
  <PayrollTab />,
  <LeavesTab />,
  <TrainingTab />,
  <RecruitmentTab />,
  <PerformanceTab />,
  <ComplianceTab />,
  <ReportsTab />,
  <NotificationsTab />,
  <SettingsTab />,
];

export default function HRDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (!role || role !== 'hr_manager') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((label, idx) => ({ label, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="HR Manager">
      <Box className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {tabComponents[tab]}
      </Box>
    </SidebarLayout>
  );
}
