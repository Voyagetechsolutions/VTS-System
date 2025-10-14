import {
  Grid, Card, CardContent, Typography, CircularProgress
} from '@mui/material';
import {
  AttachMoney as RevenueIcon, Warning as OverdueIcon,
  Schedule as PendingIcon, TrendingUp as TopRouteIcon
} from '@mui/icons-material';

export default function SummaryCards({ metrics, loading }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
            <RevenueIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {formatCurrency(metrics.totalRevenue)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Revenue
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <OverdueIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="error.main">
              {metrics.overduePayments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overdue Payments
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <PendingIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="warning.main">
              {metrics.pendingPayments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Payments
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TopRouteIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="primary" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {metrics.topRoute}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Top Route by Revenue
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
