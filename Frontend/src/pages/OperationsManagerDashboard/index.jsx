import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import OverviewTab from '../../components/operationsManager/tabs/OverviewTab';
import FleetTab from '../../components/operationsManager/tabs/FleetTab';
import RoutesManageTab from '../../components/operationsManager/tabs/RoutesManageTab';
import StaffTab from '../../components/operationsManager/tabs/StaffTab';
import ReportsTab from '../../components/operationsManager/tabs/ReportsTab';
import MaintenanceTab from '../../components/operationsManager/tabs/MaintenanceTab';
import SettingsTab from '../../components/operationsManager/tabs/SettingsTab';
import ComplianceSafetyTab from '../../components/tabs/ComplianceSafetyTab';
import DocumentsTab from '../../components/tabs/DocumentsTab';
import CommunicationsTab from '../../components/tabs/CommunicationsTab';
import ProfileSettingsTab from '../../components/tabs/ProfileSettingsTab';
import ShiftSchedulingTab from '../../components/operationsManager/tabs/ShiftSchedulingTab';
import DailyTasksTab from '../../components/operationsManager/tabs/DailyTasksTab';
import TripInfoTab from '../../components/tabs/TripInfoTab';
import FleetMaintenanceTab from '../../components/operationsManager/tabs/FleetMaintenanceTab';
import MonitoringAuditTab from '../../components/operationsManager/tabs/MonitoringAuditTab';
import CustomersTab from '../../components/companyAdmin/tabs/CustomerTab';

function PeopleHub() {
  return (
    <Box>
      <StaffTab />
      <Box sx={{ mt: 3 }}>
        <CustomersTab />
      </Box>
    </Box>
  );
}

const tabList = [
  'Operations Command Center',
  'Trip & Route Operations',
  'Fleet & Maintenance',
  'Drivers & Staff Hub',
  // Removed Daily Tasks & Workflows per spec
  'Compliance & Safety',
  'Documents Vault',
  'Communications Center',
  'Analytics & Insights',
  'Monitoring & Audit',
  'Settings & Preferences',
];

const tabComponents = [
  <OverviewTab />,                 // 1. Operations Command Center
  <RoutesManageTab />,            // 2. Trip & Route Operations
  <FleetMaintenanceTab />,        // 3. Fleet & Maintenance (combined)
  <PeopleHub />,                  // 4. Drivers & Staff Hub (now includes Customers)
  // Removed DailyTasksTab
  <ComplianceSafetyTab />,        // 6. Compliance & Safety
  <DocumentsTab />,               // 7. Documents Vault
  <CommunicationsTab />,          // 8. Communications Center
  <ReportsTab />,                 // 9. Analytics & Insights
  <MonitoringAuditTab />,         // 10. Monitoring & Audit (combined)
  <SettingsTab />,                // 11. Settings & Preferences
];

export default function OperationsManagerDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (role && role !== 'ops_manager' && role !== 'operations_manager') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((label, idx) => ({ label, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Operations Manager">
      <Box className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {tabComponents[tab]}
      </Box>
    </SidebarLayout>
  );
}
