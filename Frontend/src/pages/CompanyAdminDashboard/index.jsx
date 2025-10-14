import React, { useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
/* eslint-disable no-unused-vars */
import CommandCenterTab from '../../components/companyAdmin/tabs/CommandCenterTab';
import UsersTab from '../../components/companyAdmin/tabs/UsersTab';
import DriverHubTab from '../../components/companyAdmin/tabs/DriverHubTab';
import FleetTab from '../../components/companyAdmin/tabs/FleetTab';
import RoutesTab from '../../components/companyAdmin/tabs/RoutesTab';
import MaintenanceTab from '../../components/companyAdmin/tabs/MaintenanceTab';
import FuelTab from '../../components/companyAdmin/tabs/FuelTab';
import TripSchedulingTab from '../../components/companyAdmin/tabs/TripSchedulingTab';
import BookingsTab from '../../components/companyAdmin/tabs/BookingsTab';
import FinanceCenterTab from '../../components/companyAdmin/tabs/FinanceCenterTab';
import ReportsTab from '../../components/companyAdmin/tabs/ReportsTab';
import CustomerHubTab from '../../components/companyAdmin/tabs/CustomerHubTab';
import AttendanceHubTab from '../../components/companyAdmin/tabs/AttendanceHubTab';
import StaffHubTab from '../../components/companyAdmin/tabs/StaffHubTab';
import PayrollHubTab from '../../components/companyAdmin/tabs/PayrollHubTab';
import TrainingHubTab from '../../components/companyAdmin/tabs/TrainingHubTab';
import BusesHubTab from '../../components/companyAdmin/tabs/BusesHubTab';
import RoutesHubTab from '../../components/companyAdmin/tabs/RoutesHubTab';
import TripSchedulingHubTab from '../../components/companyAdmin/tabs/TripSchedulingHubTab';
import TripInfoHubTab from '../../components/companyAdmin/tabs/TripInfoHubTab';
import NotificationsHubTab from '../../components/companyAdmin/tabs/NotificationsHubTab';
import CommunicationsHubTab from '../../components/companyAdmin/tabs/CommunicationsHubTab';
import ComplianceHubTab from '../../components/companyAdmin/tabs/ComplianceHubTab';
import DocumentsHubTab from '../../components/companyAdmin/tabs/DocumentsHubTab';
import SystemSettingsHubTab from '../../components/companyAdmin/tabs/SystemSettingsHubTab';
import SettingsTab from '../../components/companyAdmin/tabs/SettingsTab';
// Removed SupportTab per spec
import NotificationsTab from '../../components/tabs/NotificationsTab';
import ComplianceSafetyTab from '../../components/tabs/ComplianceSafetyTab';
import DocumentsTab from '../../components/tabs/DocumentsTab';
import CommunicationsTab from '../../components/tabs/CommunicationsTab';
import AuditTrailTab from '../../components/tabs/AuditTrailTab';
import BranchesHubTab from '../../components/companyAdmin/tabs/BranchesHubTab';
import MaintenanceHubTab from '../../components/companyAdmin/tabs/MaintenanceHubTab';
import FuelHubTab from '../../components/companyAdmin/tabs/FuelHubTab';
import BookingsHubTab from '../../components/companyAdmin/tabs/BookingsHubTab';
import ReportsHubTab from '../../components/companyAdmin/tabs/ReportsHubTab';
import AuditTrailHubTab from '../../components/companyAdmin/tabs/AuditTrailHubTab';
import FinanceCenterHubTab from '../../components/companyAdmin/tabs/FinanceCenterHubTab';
import TripInfoTab from '../../components/tabs/TripInfoTab';
import { getCompanySettings, getDatabaseReadiness } from '../../supabase/api';
import ApprovalsTab from '../../components/companyAdmin/tabs/ApprovalsTab';
import GlobalCommunicationsTab from '../../components/companyAdmin/tabs/GlobalCommunicationsTab';
import OversightMapTab from '../../components/companyAdmin/tabs/OversightMapTab';
import LiveMapBusesTab from '../../components/companyAdmin/tabs/LiveMapBusesTab';
// HR modules (reused)
import HRProfilesTab from '../../components/hr/tabs/ProfilesTab';
import HRAttendanceTab from '../../components/hr/tabs/AttendanceTab';
import HRPayrollTab from '../../components/hr/tabs/PayrollTab';
import HRTrainingTab from '../../components/hr/tabs/TrainingTab';
// Inventory module (reused)
import AdminInventoryTab from '../../components/maintenanceManager/tabs/InventoryTab';
// Depot manager modules (reused)
/* eslint-enable no-unused-vars */

const baseTabList = [
  { label: 'Executive Overview', icon: 'dashboard', group: 'Command Center' },
  { label: 'Approvals & Oversight', icon: 'approval', group: 'Command Center' },
  { label: 'Global Communications', icon: 'announcement', group: 'Command Center' },
  { label: 'Oversight Map', icon: 'analytics', group: 'Command Center' },
  { label: 'Live Map Buses', icon: 'trips', group: 'Command Center' },
  { label: 'User Management', icon: 'users', group: 'People' },
  { label: 'Driver Hub', icon: 'driver', group: 'People' },
  { label: 'Customer Hub', icon: 'passengers', group: 'People' },
  // HR center
  { label: 'Staff Profiles & Roles', icon: 'users', group: 'People' },
  { label: 'Attendance & Shifts', icon: 'schedule', group: 'People' },
  { label: 'Payroll & Compensation', icon: 'revenue', group: 'People' },
  { label: 'Training & Certification', icon: 'safety', group: 'People' },
  { label: 'Buses Management', icon: 'bus', group: 'Operations' },
  { label: 'Routes Management', icon: 'route', group: 'Operations' },
  { label: 'Trip Scheduling', icon: 'schedule', group: 'Operations' },
  { label: 'Trip Information', icon: 'trips', group: 'Operations' },
  { label: 'Branches', icon: 'branches', group: 'Operations' },
  { label: 'Maintenance Logs', icon: 'maintenance', group: 'Operations' },
  { label: 'Fuel Tracking', icon: 'fuel', group: 'Operations' },
  { label: 'Bookings & Ticketing', icon: 'bookings', group: 'Bookings & Passengers' },
  { label: 'Reports & Analytics', icon: 'reports', group: 'Analytics & Insights' },
  { label: 'Audit Trail', icon: 'history', group: 'Monitoring & Audit' },
  // Communications & Management
  { label: 'Notifications & Alerts', icon: 'notifications', group: 'Communications & Engagement' },
  { label: 'Communications', icon: 'message', group: 'Communications & Engagement' },
  { label: 'Compliance & Safety', icon: 'safety', group: 'Compliance & Safety' },
  { label: 'Documents', icon: 'description', group: 'Documents Vault' },
  { label: 'System Settings', icon: 'settings', group: 'System Administration' },
  // Inventory & Finance centers
  { label: 'Inventory & Warehouse', icon: 'inventory', group: 'Operations' },
  { label: 'Finance Center', icon: 'revenue', group: 'Finance' },
  // Support removed per spec
];

const baseTabComponents = [
  <CommandCenterTab />, // Executive Overview
  <ApprovalsTab />,     // Approvals & Oversight
  <GlobalCommunicationsTab />, // Global Communications
  <OversightMapTab />,   // Oversight Map
  <LiveMapBusesTab />,   // Live Map Buses
  <UsersTab />,        // User Management
  <DriverHubTab />,    // Driver Hub
  <CustomerHubTab />,     // Customer Hub
  // HR center
  <StaffHubTab />, <AttendanceHubTab />, <PayrollHubTab />, <TrainingHubTab />,
  // Operations core
  <BusesHubTab />,        // Buses Management
  <RoutesHubTab />,       // Routes Management
  <TripSchedulingHubTab />, // Trip Scheduling
  <TripInfoHubTab />,     // Trip Information
  <BranchesHubTab />,     // Branches
  <MaintenanceHubTab />,  // Maintenance Logs
  <FuelHubTab />,         // Fuel Tracking
  <BookingsHubTab />,  // Bookings & Ticketing
  <ReportsHubTab />,   // Reports & Analytics
  <AuditTrailHubTab />, // Audit Trail
  // Communications & Management
  <NotificationsHubTab />, <CommunicationsHubTab />, <ComplianceHubTab />, <DocumentsHubTab />, <SystemSettingsHubTab />,
  // Inventory & Finance centers
  <AdminInventoryTab />, <FinanceCenterHubTab />,
];

export default function CompanyAdminDashboard() {
  const [tab, setTab] = React.useState(0);
  const [tabs, setTabs] = React.useState(baseTabList);
  const [comps, setComps] = React.useState(baseTabComponents);
  const [missing, setMissing] = React.useState([]);
  useEffect(() => {
    // Load module visibility and apply if configured
    (async () => {
      try {
        const roleKey = 'admin'; // Since we're in admin dashboard, role is guaranteed to be admin
        const { data } = await getCompanySettings();
        const allowed = data?.modules_visibility?.[roleKey];
        if (Array.isArray(allowed) && allowed.length > 0) {
          // Build a map from label to index in base list
          const keepIndices = baseTabList
            .map((t, idx) => ({ idx, label: t.label }))
            .filter(x => allowed.includes(x.label))
            .map(x => x.idx);
          const filteredTabs = baseTabList.filter((_, idx) => keepIndices.includes(idx));
          const filteredComps = baseTabComponents.filter((_, idx) => keepIndices.includes(idx));
          if (filteredTabs.length > 0) {
            setTabs(filteredTabs);
            setComps(filteredComps);
            setTab(0);
          }
        }
      } catch (error) {
        console.error('Error loading module visibility:', error);
      }
      try {
        const { data } = await getDatabaseReadiness();
        const missingList = [];
        Object.entries(data?.views || {}).forEach(([k, v]) => { if (!v) missingList.push(k); });
        Object.entries(data?.tables || {}).forEach(([k, v]) => { if (!v) missingList.push(k); });
        setMissing(missingList);
      } catch (error) {
        console.error('Error checking database readiness:', error);
      }
    })();
    const t = setInterval(async () => {
      try {
        const { data } = await getDatabaseReadiness();
        const missingList = [];
        Object.entries(data?.views || {}).forEach(([k, v]) => { if (!v) missingList.push(k); });
        Object.entries(data?.tables || {}).forEach(([k, v]) => { if (!v) missingList.push(k); });
        setMissing(missingList);
      } catch (error) {
        console.error('Error in database readiness check interval:', error);
      }
    }, 60000);
    return () => clearInterval(t);
  }, []);
  const navItems = tabs.map((item, idx) => ({ label: item.label, icon: item.icon, group: item.group, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Company Admin">
      <Box className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {missing.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Database migrations pending. Missing resources: {missing.join(', ')}. You can continue using the app; these modules will show limited data until migrations are applied.
          </Alert>
        )}
        {comps[tab]}
      </Box>
    </SidebarLayout>
  );
}
