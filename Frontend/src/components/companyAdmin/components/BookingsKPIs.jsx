import {
  Grid, Card, CardContent, Typography
} from '@mui/material';
import {
  BookOnline as BookingIcon, AttachMoney as RevenueIcon,
  Error as FailedIcon, EventSeat as SeatIcon, Schedule as TimeIcon
} from '@mui/icons-material';

export default function BookingsKPIs({ metrics }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateFailureRate = () => {
    if (metrics.totalBookings === 0) return 0;
    return ((metrics.failedTransactions / metrics.totalBookings) * 100).toFixed(1);
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={2.4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <BookingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="primary">{metrics.totalBookings}</Typography>
            <Typography variant="body2" color="text.secondary">Total Bookings</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={2.4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <RevenueIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main">{formatCurrency(metrics.totalRevenue)}</Typography>
            <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={2.4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <FailedIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="error.main">{calculateFailureRate()}%</Typography>
            <Typography variant="body2" color="text.secondary">
              Failure Rate ({metrics.failedTransactions} failed)
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={2.4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <SeatIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="info.main">{metrics.averageOccupancy}%</Typography>
            <Typography variant="body2" color="text.secondary">Avg Seat Occupancy</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={2.4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TimeIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="warning.main">{metrics.peakHour}</Typography>
            <Typography variant="body2" color="text.secondary">Peak Booking Hour</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
