import {
  Grid, Card, CardContent, Typography, CircularProgress
} from '@mui/material';
import {
  BookOnline as BookingIcon, AttachMoney as RevenueIcon,
  Schedule as DelayIcon, Cancel as CancelIcon
} from '@mui/icons-material';

export default function ReportsKPIs({ metrics, loading }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const formatMinutes = (minutes) => {
    return `${minutes.toFixed(1)} min`;
  };

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
            <BookingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="primary">{metrics.totalBookings}</Typography>
            <Typography variant="body2" color="text.secondary">Total Bookings</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <RevenueIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main">{formatCurrency(metrics.totalRevenue)}</Typography>
            <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <DelayIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="warning.main">{formatMinutes(metrics.averageDelay)}</Typography>
            <Typography variant="body2" color="text.secondary">Average Delay</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CancelIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="error.main">{formatPercentage(metrics.cancellationRate)}</Typography>
            <Typography variant="body2" color="text.secondary">Cancellation Rate</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
