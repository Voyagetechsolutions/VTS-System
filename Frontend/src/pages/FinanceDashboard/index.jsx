import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import SidebarLayout from '../../components/layout/SidebarLayout';
import RevenueTab from '../../components/finance/tabs/RevenueTab';
import TransactionsTab from '../../components/finance/tabs/TransactionsTab';
import RefundsTab from '../../components/finance/tabs/RefundsTab';
import ExpensesTab from '../../components/finance/tabs/ExpensesTab';
import ReportsTab from '../../components/finance/tabs/ReportsTab';
import NotificationsTab from '../../components/finance/tabs/NotificationsTab';
import SettingsTab from '../../components/finance/tabs/SettingsTab';
// New Tabs
import OverviewTab from '../../components/finance/tabs/OverviewTab';
import PayrollIntegrationTab from '../../components/finance/tabs/PayrollIntegrationTab';
import InvoicingTab from '../../components/finance/tabs/InvoicingTab';
import TaxComplianceTab from '../../components/finance/tabs/TaxComplianceTab';
import BudgetForecastTab from '../../components/finance/tabs/BudgetForecastTab';
import CashFlowTab from '../../components/finance/tabs/CashFlowTab';
import CostControlTab from '../../components/finance/tabs/CostControlTab';
import LoansAssetsTab from '../../components/finance/tabs/LoansAssetsTab';
import VendorsPaymentsTab from '../../components/finance/tabs/VendorsPaymentsTab';
import InsuranceClaimsTab from '../../components/finance/tabs/InsuranceClaimsTab';
import KPIsBenchmarkTab from '../../components/finance/tabs/KPIsBenchmarkTab';
import IntegrationsTab from '../../components/finance/tabs/IntegrationsTab';
import DynamicPricingTab from '../../components/finance/tabs/DynamicPricingTab';
import RiskTab from '../../components/finance/tabs/RiskTab';
import SubsidiesTab from '../../components/finance/tabs/SubsidiesTab';
import ESGTab from '../../components/finance/tabs/ESGTab';
import LoyaltyTab from '../../components/finance/tabs/LoyaltyTab';
import ContractsTab from '../../components/finance/tabs/ContractsTab';
import BIAnalyticsTab from '../../components/finance/tabs/BIAnalyticsTab';
import ComplianceTab from '../../components/finance/tabs/ComplianceTab';
import SubscriptionsTab from '../../components/finance/tabs/SubscriptionsTab';

const tabList = [
  'Finance Overview',
  'Revenue & Trip Income',
  'Payments & Transactions',
  'Refunds & Adjustments',
  'Expenses & Cost Tracking',
  'Payroll & HR Integration',
  'Invoicing & Corporate',
  'Taxation & Compliance',
  'Budgeting & Forecasting',
  'Cash Flow',
  'Cost Control & Optimization',
  'Loans & Assets',
  'Vendors & Supplier Payments',
  'Insurance & Claims',
  'Dynamic Pricing & Promotions',
  'Risk Dashboard',
  'Subsidies',
  'ESG & Sustainability',
  'Loyalty',
  'Contracts & Tenders',
  'Financial Reports & Analytics',
  'KPIs & Benchmarking',
  'BI & Drill-down',
  'Compliance Templates',
  'Subscriptions',
  'Integrations',
  'Notifications & Alerts',
  'Settings',
];

const tabComponents = [
  <OverviewTab />,
  <RevenueTab />,
  <TransactionsTab />,
  <RefundsTab />,
  <ExpensesTab />,
  <PayrollIntegrationTab />,
  <InvoicingTab />,
  <TaxComplianceTab />,
  <BudgetForecastTab />,
  <CashFlowTab />,
  <CostControlTab />,
  <LoansAssetsTab />,
  <VendorsPaymentsTab />,
  <InsuranceClaimsTab />,
  <DynamicPricingTab />,
  <RiskTab />,
  <SubsidiesTab />,
  <ESGTab />,
  <LoyaltyTab />,
  <ContractsTab />,
  <ReportsTab />,
  <KPIsBenchmarkTab />,
  <BIAnalyticsTab />,
  <ComplianceTab />,
  <SubscriptionsTab />,
  <IntegrationsTab />,
  <NotificationsTab />,
  <SettingsTab />,
];

export default function FinanceDashboard() {
  const [tab, setTab] = React.useState(0);
  useEffect(() => {
    const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole');
    if (!role || role !== 'finance_manager') {
      window.location.replace('/');
    }
  }, []);
  const navItems = tabList.map((label, idx) => ({ label, selected: tab === idx, onClick: () => setTab(idx) }));
  return (
    <SidebarLayout navItems={navItems} title="Finance">
      <Box className="fade-in" sx={{ overflow: 'hidden', width: '100%' }}>
        {tabComponents[tab]}
      </Box>
    </SidebarLayout>
  );
}
