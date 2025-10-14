import React, { useMemo } from 'react';
import {
  Card, CardContent, Typography, Box
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

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
        <Typography variant="body2" color="primary">
          Total Passengers: {payload[0].value}
        </Typography>
        <Typography variant="body2" color="secondary">
          Unique Passengers: {payload[1].value}
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function PassengersChart({ data, onChartClick }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group passengers by date
    const dateGroups = data.reduce((acc, booking) => {
      const date = new Date(booking.booking_datetime).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          passengers: 0,
          uniquePassengers: new Set()
        };
      }
      
      if (booking.status === 'Confirmed') {
        acc[date].passengers += 1;
        acc[date].uniquePassengers.add(booking.passenger_name);
      }
      
      return acc;
    }, {});

    return Object.values(dateGroups)
      .map(group => ({
        date: group.date,
        passengers: group.passengers,
        uniquePassengers: group.uniquePassengers.size
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days
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
          Passenger Statistics
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
                No passenger data available
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
                <YAxis />
                <Tooltip content={CustomTooltip} />
                <Line 
                  type="monotone" 
                  dataKey="passengers" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  name="Total Passengers"
                  style={{ cursor: 'pointer' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="uniquePassengers" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  name="Unique Passengers"
                  style={{ cursor: 'pointer' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Daily passenger counts over the last 30 days
        </Typography>
      </CardContent>
    </Card>
  );
}
