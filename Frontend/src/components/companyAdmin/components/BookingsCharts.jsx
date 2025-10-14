import { useMemo } from 'react';
import {
  Grid, Card, CardContent, Typography, Box
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function BookingsCharts({ bookings }) {
  const chartData = useMemo(() => {
    if (!bookings || bookings.length === 0) return {
      byBranch: [],
      byChannel: [],
      byRoute: [],
      byTimeOfDay: [],
      revenueByRoute: []
    };

    // Bookings by Branch
    const branchGroups = bookings.reduce((acc, booking) => {
      const branch = booking.branch?.name || 'Unknown Branch';
      acc[branch] = (acc[branch] || 0) + 1;
      return acc;
    }, {});

    const byBranch = Object.entries(branchGroups).map(([name, count]) => ({
      name,
      bookings: count
    }));

    // Bookings by Channel
    const channelGroups = bookings.reduce((acc, booking) => {
      const channel = booking.channel || 'Unknown';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {});

    const byChannel = Object.entries(channelGroups).map(([name, count]) => ({
      name,
      bookings: count
    }));

    // Bookings by Route
    const routeGroups = bookings.reduce((acc, booking) => {
      const route = booking.trip?.route ? 
        `${booking.trip.route.pick_up} → ${booking.trip.route.drop_off}` : 
        'Unknown Route';
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {});

    const byRoute = Object.entries(routeGroups)
      .map(([name, count]) => ({ name, bookings: count }))
      .slice(0, 10); // Top 10 routes

    // Bookings by Time of Day
    const timeGroups = bookings.reduce((acc, booking) => {
      const hour = new Date(booking.booking_datetime).getHours();
      const timeSlot = `${hour}:00`;
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {});

    const byTimeOfDay = Object.entries(timeGroups)
      .map(([time, count]) => ({ time, bookings: count }))
      .sort((a, b) => a.time.localeCompare(b.time));

    // Revenue by Route (mock data - $25 per confirmed booking)
    const revenueGroups = bookings
      .filter(booking => booking.status === 'Confirmed')
      .reduce((acc, booking) => {
        const route = booking.trip?.route ? 
          `${booking.trip.route.pick_up} → ${booking.trip.route.drop_off}` : 
          'Unknown Route';
        acc[route] = (acc[route] || 0) + 25; // Mock $25 per booking
        return acc;
      }, {});

    const revenueByRoute = Object.entries(revenueGroups)
      .map(([name, revenue]) => ({ name, revenue }))
      .slice(0, 8); // Top 8 routes

    return {
      byBranch,
      byChannel,
      byRoute,
      byTimeOfDay,
      revenueByRoute
    };
  }, [bookings]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Bookings by Branch */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Bookings by Branch</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData.byBranch}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Bookings by Channel */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Bookings by Channel</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData.byChannel}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="bookings"
                  >
                    {chartData.byChannel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Bookings by Route */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Top Routes by Bookings</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData.byRoute} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Booking Time of Day */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Booking Frequency by Hour</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData.byTimeOfDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="bookings" stroke="#FFBB28" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Revenue by Route */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Revenue by Route</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData.revenueByRoute}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
