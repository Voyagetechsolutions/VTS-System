import React, { useMemo } from 'react';
import {
  Card, CardContent, Typography, Box
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Custom tooltip component defined outside render
const CustomTooltip = ({ active, payload, label }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (active && payload && payload.length) {
    return (
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: 1, 
        border: 1, 
        borderColor: 'divider',
        borderRadius: 1
      }}>
        <Typography variant="body2" fontWeight="medium">
          {label}
        </Typography>
        <Typography variant="body2" color="success.main">
          Revenue: {formatCurrency(payload[0].value)}
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function RevenueBarChart({ data, onChartClick }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group revenue by route (mock $25 per confirmed booking)
    const routeGroups = data
      .filter(booking => booking.status === 'Confirmed')
      .reduce((acc, booking) => {
        const route = booking.trip?.route ? 
          `${booking.trip.route.pick_up} → ${booking.trip.route.drop_off}` : 
          'Unknown Route';
        acc[route] = (acc[route] || 0) + 25; // Mock $25 per booking
        return acc;
      }, {});

    return Object.entries(routeGroups)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 routes
  }, [data]);

  const handleClick = (data) => {
    if (onChartClick) {
      onChartClick(data);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };


  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Revenue by Route
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          {chartData.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}>
              <Typography variant="body2" color="text.secondary">
                No revenue data available
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer>
              <BarChart data={chartData} onClick={handleClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip content={CustomTooltip} />
                <Bar 
                  dataKey="revenue" 
                  fill="#00C49F" 
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Click on bars to drill down into detailed data
        </Typography>
      </CardContent>
    </Card>
  );
}
