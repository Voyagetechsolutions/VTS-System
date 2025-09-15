import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Stack, List, ListItem, ListItemText, Divider } from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DirectionsBusFilledIcon from '@mui/icons-material/DirectionsBusFilled';
import PeopleIcon from '@mui/icons-material/People';
import EngineeringIcon from '@mui/icons-material/Engineering';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import { getAdminOversightSnapshot } from '../../../supabase/api';

export default function OversightMapTab() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await getAdminOversightSnapshot();
      setSnapshot(data);
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  if (!snapshot) return <Typography>Loading oversight...</Typography>;

  const Section = ({ title, icon, children, kpi }) => (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{icon}{title}</Typography>
          {kpi != null && <Chip label={kpi} color="primary" size="small" />}
        </Stack>
        <Divider sx={{ my: 2 }} />
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Oversight Map</Typography>
      <Grid container spacing={3}>
        {/* 1. Booking Office */}
        <Grid item xs={12} md={6}>
          <Section title="Booking Office" icon={<ConfirmationNumberIcon color="primary" />} kpi={`Vol: ${formatNumber(snapshot.booking.volumeToday)} • Fraud: ${snapshot.booking.fraudAlerts}`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`Refund approvals pending: ${snapshot.booking.largeRefundsPending}`} secondary="Admin approves large/policy-exception refunds" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Reconciliation status: ${snapshot.booking.reconciliationStatus}`} secondary="Monitor payments vs bookings" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Blacklist overrides today: ${snapshot.booking.blacklistOverrides}`} secondary="Admin can override blacklist/whitelist" />
              </ListItem>
            </List>
          </Section>
        </Grid>

        {/* 2. Boarding Operator */}
        <Grid item xs={12} md={6}>
          <Section title="Boarding" icon={<PeopleIcon color="primary" />} kpi={`Seat Util: ${snapshot.boarding.seatUtilizationPct}%`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`Incident notifications: ${snapshot.boarding.incidentsToday}`} secondary="Denied boarding, disputes" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Aggregated delays: ${snapshot.boarding.delays}`} secondary="Company-wide status" />
              </ListItem>
            </List>
          </Section>
        </Grid>

        {/* 3. Driver */}
        <Grid item xs={12} md={6}>
          <Section title="Driver" icon={<DirectionsBusFilledIcon color="primary" />} kpi={`Completion: ${snapshot.driver.completionRate}%`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`Accidents: ${snapshot.driver.accidents}`} secondary="Safety violations escalated" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`On-time score: ${snapshot.driver.onTimeScore}`} secondary="Performance scorecards" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Certifications expired: ${snapshot.driver.expiredCerts}`} secondary="Compliance validation" />
              </ListItem>
            </List>
          </Section>
        </Grid>

        {/* 4. Operations Manager */}
        <Grid item xs={12} md={6}>
          <Section title="Operations" icon={<AssessmentIcon color="primary" />} kpi={`Utilization: ${snapshot.ops.utilizationPct}%`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`Pending route approvals: ${snapshot.ops.routeApprovals}`} secondary="Create/modify/suspend routes" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Dead mileage: ${formatNumber(snapshot.ops.deadMileageKm)} km`} secondary="Congestion impacts" />
              </ListItem>
            </List>
          </Section>
        </Grid>

        {/* 5. Depot Manager */}
        <Grid item xs={12} md={6}>
          <Section title="Depot" icon={<Inventory2Icon color="primary" />} kpi={`Readiness: ${snapshot.depot.readinessPct}%`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`Staff shortages: ${snapshot.depot.staffShortages}`} secondary="Overtime & shift gaps" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Buses down: ${snapshot.depot.busesDown}`} secondary="Awaiting repair" />
              </ListItem>
            </List>
          </Section>
        </Grid>

        {/* 6. Maintenance */}
        <Grid item xs={12} md={6}>
          <Section title="Maintenance" icon={<EngineeringIcon color="primary" />} kpi={`Downtime: ${snapshot.maintenance.downtimePct}%`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`Major jobs pending approval: ${snapshot.maintenance.majorApprovals}`} secondary="Vendor contracts & budgets" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Cost impact (month): ${formatCurrency(snapshot.maintenance.monthCost)}`} secondary="Repairs + parts" />
              </ListItem>
            </List>
          </Section>
        </Grid>

        {/* 7. Finance */}
        <Grid item xs={12} md={6}>
          <Section title="Finance" icon={<PaymentsIcon color="primary" />} kpi={`P&L: ${formatCurrency(snapshot.finance.pnlMonth)}`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`High-risk refunds: ${snapshot.finance.highRiskRefunds}`} secondary="Escalations to Admin" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Large expenses pending: ${snapshot.finance.largeExpensesPending}`} secondary="Depot/Maintenance" />
              </ListItem>
            </List>
          </Section>
        </Grid>

        {/* 8. HR */}
        <Grid item xs={12} md={6}>
          <Section title="HR" icon={<PeopleIcon color="primary" />} kpi={`Turnover: ${snapshot.hr.turnoverRate}%`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`Critical hires pending: ${snapshot.hr.criticalHires}`} secondary="Drivers, depot managers" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Payroll adjustments pending: ${snapshot.hr.payrollAdjustments}`} secondary="High-level approvals" />
              </ListItem>
            </List>
          </Section>
        </Grid>

        {/* 9. Notifications */}
        <Grid item xs={12} md={6}>
          <Section title="Notifications" icon={<NotificationsIcon color="primary" />} kpi={`Escalations: ${snapshot.alerts.escalationsToday}`}>
            <List dense>
              <ListItem>
                <ListItemText primary={`Broadcasts sent: ${snapshot.alerts.broadcasts}`} secondary="Urgent / policy updates" />
              </ListItem>
              <ListItem>
                <ListItemText primary={`Rules configured: ${snapshot.alerts.rules}`} secondary="Who gets what" />
              </ListItem>
            </List>
          </Section>
        </Grid>
      </Grid>
    </Box>
  );
}


