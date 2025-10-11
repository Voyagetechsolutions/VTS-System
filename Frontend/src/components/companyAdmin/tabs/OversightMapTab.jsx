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
import { getAdminOversightSnapshot, getOpsSnapshotFromViews } from '../../../supabase/api';

export default function OversightMapTab() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    const load = async () => {
      let data = null;
      try {
        const res = await getOpsSnapshotFromViews();
        data = res.data || null;
      } catch {}
      if (!data) {
        const fallback = await getAdminOversightSnapshot();
        data = fallback.data || null;
      }
      setSnapshot(data);
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  if (!snapshot) return <Typography>Loading oversight...</Typography>;

  const Section = ({ title, icon, children, kpi, intent = 'default' }) => (
    <Card sx={{ borderLeft: 4, borderLeftColor: intent === 'danger' ? 'error.main' : intent === 'warning' ? 'warning.main' : 'primary.main' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{icon}{title}</Typography>
          {kpi != null && <Chip label={kpi} color={intent === 'danger' ? 'error' : intent === 'warning' ? 'warning' : 'primary'} size="small" />}
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
          <Section
            title="Booking Office"
            icon={<ConfirmationNumberIcon color="primary" />}
            kpi={`Vol: ${formatNumber(snapshot.booking.volumeToday)} • Fraud: ${snapshot.booking.fraudAlerts}`}
            intent={snapshot.booking.fraudAlerts > 0 ? 'warning' : 'default'}
          >
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
          <Section
            title="Boarding"
            icon={<PeopleIcon color="primary" />}
            kpi={`Seat Util: ${snapshot.boarding.seatUtilizationPct}%`}
            intent={snapshot.boarding.delays > 5 ? 'warning' : 'default'}
          >
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
          <Section
            title="Driver"
            icon={<DirectionsBusFilledIcon color="primary" />}
            kpi={`Completion: ${snapshot.driver.completionRate}%`}
            intent={snapshot.driver.accidents > 0 ? 'danger' : 'default'}
          >
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
          <Section
            title="Operations"
            icon={<AssessmentIcon color="primary" />}
            kpi={`Utilization: ${snapshot.ops.utilizationPct}%`}
            intent={snapshot.ops.utilizationPct < 60 ? 'warning' : 'default'}
          >
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
          <Section
            title="Depot"
            icon={<Inventory2Icon color="primary" />}
            kpi={`Readiness: ${snapshot.depot.readinessPct}%`}
            intent={snapshot.depot.busesDown > 0 ? 'warning' : 'default'}
          >
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
          <Section
            title="Maintenance"
            icon={<EngineeringIcon color="primary" />}
            kpi={`Downtime: ${snapshot.maintenance.downtimePct}%`}
            intent={snapshot.maintenance.downtimePct > 20 ? 'danger' : snapshot.maintenance.majorApprovals > 0 ? 'warning' : 'default'}
          >
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
          <Section
            title="Finance"
            icon={<PaymentsIcon color="primary" />}
            kpi={`P&L: ${formatCurrency(snapshot.finance.pnlMonth)}`}
            intent={snapshot.finance.highRiskRefunds > 0 ? 'warning' : 'default'}
          >
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
          <Section
            title="HR"
            icon={<PeopleIcon color="primary" />}
            kpi={`Turnover: ${snapshot.hr.turnoverRate}%`}
            intent={snapshot.hr.turnoverRate > 10 ? 'warning' : 'default'}
          >
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
          <Section
            title="Notifications"
            icon={<NotificationsIcon color="primary" />}
            kpi={`Escalations: ${snapshot.alerts.escalationsToday}`}
            intent={snapshot.alerts.escalationsToday > 0 ? 'warning' : 'default'}
          >
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


