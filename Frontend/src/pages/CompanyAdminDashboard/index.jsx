import React, { useEffect } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import CommandCenterTab from '../../components/companyAdmin/tabs/CommandCenterTab';
import UsersTab from '../../components/companyAdmin/tabs/UsersTab';
import DriverHubTab from '../../components/companyAdmin/tabs/DriverHubTab';
import FleetTab from '../../components/companyAdmin/tabs/FleetTab';
import RoutesTab from '../../components/companyAdmin/tabs/RoutesTab';
import MaintenanceTab from '../../components/companyAdmin/tabs/MaintenanceTab';
import FuelTab from '../../components/companyAdmin/tabs/FuelTab';
import SchedulingTab from '../../components/companyAdmin/tabs/SchedulingTab';
import BookingsTab from '../../components/companyAdmin/tabs/BookingsTab';
import FinanceCenterTab from '../../components/companyAdmin/tabs/FinanceCenterTab';
import ReportsTab from '../../components/companyAdmin/tabs/ReportsTab';
import CustomerTab from '../../components/companyAdmin/tabs/CustomerTab';
import SettingsTab from '../../components/companyAdmin/tabs/SettingsTab';
import SupportTab from '../../components/companyAdmin/tabs/SupportTab';
import NotificationsTab from '../../components/tabs/NotificationsTab';
import ComplianceSafetyTab from '../../components/tabs/ComplianceSafetyTab';
import DocumentsTab from '../../components/tabs/DocumentsTab';
import CommunicationsTab from '../../components/tabs/CommunicationsTab';
import AuditTrailTab from '../../components/tabs/AuditTrailTab';
import ProfileSettingsTab from '../../components/tabs/ProfileSettingsTab';
import BranchesTab from '../../components/companyAdmin/tabs/BranchesTab';
import TripInfoTab from '../../components/tabs/TripInfoTab';
import ApprovalsTab from '../../components/companyAdmin/tabs/ApprovalsTab';
import GlobalCommunicationsTab from '../../components/companyAdmin/tabs/GlobalCommunicationsTab';
import OversightMapTab from '../../components/companyAdmin/tabs/OversightMapTab';
// HR modules (reused)
import HRProfilesTab from '../../components/hr/tabs/ProfilesTab';
import HRAttendanceTab from '../../components/hr/tabs/AttendanceTab';
import HRPayrollTab from '../../components/hr/tabs/PayrollTab';
import HRTrainingTab from '../../components/hr/tabs/TrainingTab';
// Inventory module (reused)
import AdminInventoryTab from '../../components/maintenanceManager/tabs/InventoryTab';
// Depot manager modules (reused)
import DepotOpsSupervisorTab from '../../components/depotManager/tabs/OpsSupervisorTab';
import DepotDispatchTab from '../../components/depotManager/tabs/DispatchTab';
import DepotStaffShiftTab from '../../components/depotManager/tabs/StaffShiftTab';

const tabList = [
  { label: 'Executive Overview', icon: 'dashboard', group: 'Command Center' },
  { label: 'Approvals & Oversight', icon: 'approval', group: 'Command Center' },
  { label: 'Global Communications', icon: 'announcement', group: 'Command Center' },
  { label: 'Oversight Map', icon: 'analytics', group: 'Command Center' },
  { label: 'User Management', icon: 'users', group: 'People' },
  { label: 'Driver Hub', icon: 'driver', group: 'People' },
  { label: 'Customer Hub', icon: 'passengers', group: 'People' },
  // HR center
  { label: 'HR: Profiles', icon: 'users', group: 'People' },
  { label: 'HR: Attendance', icon: 'schedule', group: 'People' },
  { label: 'HR: Payroll', icon: 'revenue', group: 'People' },
  { label: 'HR: Training', icon: 'safety', group: 'People' },
  { label: 'Fleet Management', icon: 'bus', group: 'Operations' },
  { label: 'Routes & Scheduling', icon: 'route', group: 'Operations' },
  { label: 'Branches', icon: 'branches', group: 'Operations' },
  { label: 'Bookings & Ticketing', icon: 'bookings', group: 'Bookings & Passengers' },
  { label: 'Reports & Analytics', icon: 'reports', group: 'Analytics & Insights' },
  { label: 'Audit Trail', icon: 'history', group: 'Monitoring & Audit' },
  // Extended operations and centers
  { label: 'Maintenance', icon: 'maintenance', group: 'Operations' },
  { label: 'Fuel Tracking', icon: 'build', group: 'Operations' },
  { label: 'Trip Scheduling', icon: 'schedule', group: 'Operations' },
  // Depot manager capabilities
  { label: 'Depot: Ops Supervisor', icon: 'assignment', group: 'Depot Operations' },
  { label: 'Depot: Dispatch', icon: 'route', group: 'Depot Operations' },
  { label: 'Depot: Staff & Shifts', icon: 'schedule', group: 'Depot Operations' },
  // Inventory & Finance centers
  { label: 'Inventory & Warehouse', icon: 'inventory', group: 'Operations' },
  { label: 'Finance Center', icon: 'revenue', group: 'Finance' },
  { label: 'Notifications & Alerts', icon: 'notifications', group: 'Communications & Engagement' },
  { label: 'Trip Info', icon: 'trips', group: 'Operations' },
  { label: 'Compliance & Safety', icon: 'safety', group: 'Compliance & Safety' },
  { label: 'Documents', icon: 'documents', group: 'Documents Vault' },
  { label: 'Communications', icon: 'communications', group: 'Communications & Engagement' },
  { label: 'System Settings', icon: 'settings', group: 'Customization & Settings' },
  { label: 'Support', icon: 'support', group: 'Support & Helpdesk' },
  { label: 'Profile', icon: 'profile', group: 'Customization & Settings' }
];

const tabComponents = [
  <CommandCenterTab />, // Executive Overview
  <ApprovalsTab />,     // Approvals & Oversight
  <GlobalCommunicationsTab />, // Global Communications
  <OversightMapTab />,   // Oversight Map
  <UsersTab />,        // User Management
  <DriverHubTab />,    // Driver Hub
  <CustomerTab />,     // Customer Hub
  // HR center
  <HRProfilesTab />, <HRAttendanceTab />, <HRPayrollTab />, <HRTrainingTab />,
  // Operations core
  <FleetTab />,        // Fleet Management
  <RoutesTab />,       // Routes & Scheduling (primary routes view)
  <BranchesTab />,     // Branches
  <BookingsTab />,     // Bookings & Ticketing
  <ReportsTab />,      // Reports & Analytics
  <AuditTrailTab scope="admin" />, // Audit Trail
  // Extended operations and centers (order aligned with tabList)
  <MaintenanceTab />, <FuelTab />, <SchedulingTab />,
  // Depot manager capabilities
  <DepotOpsSupervisorTab />, <DepotDispatchTab />, <DepotStaffShiftTab />,
  // Inventory & Finance centers
  <AdminInventoryTab />, <FinanceCenterTab />,
  // Shared
  <NotificationsTab />, <TripInfoTab scope="admin" />, <ComplianceSafetyTab />, <DocumentsTab />,
  <CommunicationsTab />, <SettingsTab />, <SupportTab />, <ProfileSettingsTab />
];

export default function CompanyAdminDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    // Simple RBAC guard: only allow admin role
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (role && role !== 'admin') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((item, idx) => ({ label: item.label, icon: item.icon, group: item.group, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Company Admin">
      <Paper elevation={1} sx={{ p: 1, borderRadius: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {tabList.map((item) => <Tab key={item.label} label={item.label} />)}
        </Tabs>
      </Paper>
      <Box mt={2} className="fade-in">{tabComponents[tab]}</Box>
    </SidebarLayout>
  );
}
