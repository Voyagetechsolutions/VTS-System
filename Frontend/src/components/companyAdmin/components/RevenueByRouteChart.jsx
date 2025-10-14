import React from 'react';
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

const RevenueByRouteChart = ({ data, loading }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Revenue by Route</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading chart data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Revenue by Route</Typography>
        
        <Box sx={{ width: '100%', height: 300 }}>
          {data.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}>
              <Typography variant="body2" color="text.secondary">
                No route revenue data available
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer>
              <BarChart data={data.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="route" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={11}
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip content={CustomTooltip} />
                <Bar 
                  dataKey="revenue" 
                  fill="#00C49F" 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>

        {data.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing top {Math.min(8, data.length)} routes by revenue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Highest: {data[0]?.route} - {formatCurrency(data[0]?.revenue || 0)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default RevenueByRouteChart;
