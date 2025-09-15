import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Button, Box } from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import PaidIcon from '@mui/icons-material/Paid';
import EventIcon from '@mui/icons-material/Event';
import { formatNumber, formatCurrency } from '../../../utils/formatters';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import LineChart from '../charts/LineChart';
import { supabase } from '../../../supabase/client';

// OverviewTab: KPIs, quick actions, charts
export default function OverviewTab() {
  const [kpis, setKpis] = useState({});
  useEffect(() => {
    (async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      // Bookings per route today
      const { data: today } = await supabase
        .from('bookings_with_company')
        .select('booking_id, trip_id, booking_date')
        .eq('company_id', window.companyId)
        .gte('booking_date', start.toISOString())
        .lte('booking_date', end.toISOString());
      const { data: trips } = await supabase
        .from('trips_with_company')
        .select('trip_id, origin, destination')
        .eq('company_id', window.companyId);
      const tMap = new Map((trips||[]).map(t => [t.trip_id, `${t.origin} - ${t.destination}`]));
      const byRoute = new Map();
      (today||[]).forEach(b => { const key = tMap.get(b.trip_id) || 'Unknown'; byRoute.set(key, (byRoute.get(key)||0)+1); });
      const bookingsPerRoute = Array.from(byRoute.entries()).map(([route, bookings]) => ({ route, bookings })).slice(0, 10);

      // Revenue last 7 days for this agent (if we had agent id/email, fallback to company)
      const revStart = new Date(); revStart.setDate(revStart.getDate()-6); revStart.setHours(0,0,0,0);
      const { data: pays } = await supabase
        .from('payments')
        .select('amount, paid_at')
        .gte('paid_at', revStart.toISOString());
      const byDay = new Map();
      (pays||[]).forEach(p => { const d = new Date(p.paid_at); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; byDay.set(k, (byDay.get(k)||0) + Number(p.amount||0)); });
      const revenue7 = Array.from(byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([day, revenue]) => ({ day, revenue }));

      setKpis({ bookingsPerRoute, dailyRevenue: revenue7 });
    })();
  }, []);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Bookings Today</Typography><ConfirmationNumberIcon /></Box><Typography>{formatNumber(kpis.bookingsToday || 0)}</Typography></Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Cancellations</Typography><CancelIcon /></Box><Typography>{formatNumber(kpis.cancellations || 0)}</Typography></Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Refunds</Typography><ReplayIcon /></Box><Typography>{formatNumber(kpis.refunds || 0)}</Typography></Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Revenue</Typography><PaidIcon /></Box><Typography>{formatCurrency(kpis.revenue || 0)}</Typography></Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Upcoming Trips</Typography><EventIcon /></Box><Typography>{formatNumber(kpis.upcomingTrips || 0)}</Typography></Paper>
        </Grid>
      </Grid>
      <Box mt={4}>
        <Button variant="contained" color="primary">Create Booking</Button>
        <Button variant="contained" color="error" sx={{ ml: 2 }}>Cancel Booking</Button>
        <Button variant="contained" color="secondary" sx={{ ml: 2 }}>Process Refund</Button>
      </Box>
      <Box mt={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
        <Box>
          <Typography variant="h6">Bookings Per Route (Today)</Typography>
          <BarChart data={kpis.bookingsPerRoute || []} xKey="route" yKey="bookings" />
        </Box>
        <Box>
          <Typography variant="h6">Revenue (Last 7 days)</Typography>
          <BarChart data={kpis.dailyRevenue || []} xKey="day" yKey="revenue" />
        </Box>
      </Box>
      <Box mt={4}>
        <Typography variant="h5">Cancellations</Typography>
        <PieChart data={kpis.cancellationsChart || []} nameKey="reason" valueKey="count" />
      </Box>
    </Box>
  );
}
