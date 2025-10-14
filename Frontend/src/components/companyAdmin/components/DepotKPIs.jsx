import {
  Grid, Card, CardContent, Typography, CircularProgress
} from '@mui/material';
import {
  DirectionsBus as BusIcon, Person as DriverIcon,
  Schedule as TripIcon, Group as StaffIcon
} from '@mui/icons-material';

export default function DepotKPIs({ metrics, loading }) {
  if (loading) {
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} md={3} key={item}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TripIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="primary">{metrics.totalTripsToday}</Typography>
            <Typography variant="body2" color="text.secondary">Total Trips Today</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <BusIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main">{metrics.activeBuses}</Typography>
            <Typography variant="body2" color="text.secondary">Active Buses</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <DriverIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="info.main">{metrics.activeDrivers}</Typography>
            <Typography variant="body2" color="text.secondary">Active Drivers</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <StaffIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="warning.main">{metrics.staffOnShift}</Typography>
            <Typography variant="body2" color="text.secondary">Staff on Shift</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
