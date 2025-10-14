import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Custom tooltip component defined outside render
const CustomTooltip = ({ active, payload, label }) => {
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
          {new Date(label).toLocaleDateString()}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(1)}%
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

export default function TripPerformanceChart({ data, onChartClick }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group trips by date and calculate performance metrics
    const dateGroups = data.reduce((acc, trip) => {
      const date = new Date(trip.departure).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          onTime: 0,
          delayed: 0,
          cancelled: 0
        };
      }
      
      acc[date].total += 1;
      
      if (trip.status === 'Completed') {
        // Mock delay calculation - use trip ID hash for consistent results
        const hash = trip.id ? trip.id.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0) : 0;
        
        // Use hash to determine if on time (80% chance)
        if (Math.abs(hash) % 10 < 8) {
          acc[date].onTime += 1;
        } else {
          acc[date].delayed += 1;
        }
      } else if (trip.status === 'Cancelled') {
        acc[date].cancelled += 1;
      }
      
      return acc;
    }, {});

    return Object.values(dateGroups)
      .map(group => ({
        ...group,
        onTimeRate: group.total > 0 ? (group.onTime / group.total) * 100 : 0,
        delayRate: group.total > 0 ? (group.delayed / group.total) * 100 : 0,
        cancellationRate: group.total > 0 ? (group.cancelled / group.total) * 100 : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Last 14 days
  }, [data]);

  const handleClick = (data) => {
    if (onChartClick) {
      onChartClick(data);
    }
  };


  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Trip Performance Trends
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
                No trip performance data available
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer>
              <LineChart data={chartData} onClick={handleClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip content={CustomTooltip} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="onTimeRate" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  name="On-Time Rate"
                  style={{ cursor: 'pointer' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="delayRate" 
                  stroke="#FFBB28" 
                  strokeWidth={2}
                  name="Delay Rate"
                  style={{ cursor: 'pointer' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cancellationRate" 
                  stroke="#FF8042" 
                  strokeWidth={2}
                  name="Cancellation Rate"
                  style={{ cursor: 'pointer' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Performance metrics over the last 14 days
        </Typography>
      </CardContent>
    </Card>
  );
}
