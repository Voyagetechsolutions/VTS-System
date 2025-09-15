import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Button, Box } from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import GroupsIcon from '@mui/icons-material/Groups';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { formatNumber } from '../../../utils/formatters';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import LineChart from '../charts/LineChart';
import { getBoardingOperatorKPIs } from '../../../supabase/api';

// OverviewTab: KPIs, quick actions, charts
export default function OverviewTab() {
  const [kpis, setKpis] = useState({});
  useEffect(() => {
    getBoardingOperatorKPIs().then(res => setKpis(res.data));
  }, []);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Trips Scheduled</Typography><ConfirmationNumberIcon /></Box><Typography>{formatNumber(kpis.tripsScheduled || 0)}</Typography></Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Passengers Expected</Typography><GroupsIcon /></Box><Typography>{formatNumber(kpis.passengersExpected || 0)}</Typography></Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Delayed Trips</Typography><AvTimerIcon /></Box><Typography>{formatNumber(kpis.delayedTrips || 0)}</Typography></Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Cancelled Trips</Typography><CancelIcon /></Box><Typography>{formatNumber(kpis.cancelledTrips || 0)}</Typography></Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper className="kpi-card" sx={{ p: 2 }}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">Boarding Completed</Typography><DoneAllIcon /></Box><Typography>{formatNumber(kpis.boardingCompleted || 0)}</Typography></Paper>
        </Grid>
      </Grid>
      <Box mt={4}>
        <Button variant="contained" color="primary">Start Boarding</Button>
        <Button variant="contained" color="success" sx={{ ml: 2 }}>Mark Trip Departed</Button>
        <Button variant="contained" color="error" sx={{ ml: 2 }}>Report Delay</Button>
      </Box>
      <Box mt={4}>
        <Typography variant="h5">Daily Boarding Stats</Typography>
        <BarChart data={kpis.boardingStats || []} xKey="day" yKey="boarded" />
      </Box>
      <Box mt={4}>
        <Typography variant="h5">Delays</Typography>
        <LineChart data={kpis.delays || []} xKey="time" yKey="delays" />
      </Box>
      <Box mt={4}>
        <Typography variant="h5">Occupancy Per Trip</Typography>
        <PieChart data={kpis.occupancyPerTrip || []} nameKey="trip" valueKey="occupancy" />
      </Box>
    </Box>
  );
}
