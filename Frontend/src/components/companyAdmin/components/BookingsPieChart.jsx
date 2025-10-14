import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: 1, 
        border: 1, 
        borderColor: 'divider',
        borderRadius: 1
      }}>
        <Typography variant="body2" fontWeight="medium">
          {data.name}
        </Typography>
        <Typography variant="body2" color="primary">
          {data.value} bookings ({data.percentage}%)
        </Typography>
      </Box>
    );
  }
  return null;
};

const BookingsPieChart = ({ data, onChartClick, loading }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const total = data.reduce((sum, item) => sum + item.count, 0);
    
    return data.map((item, index) => ({
      name: item.status,
      value: item.count,
      percentage: ((item.count / total) * 100).toFixed(1),
      color: COLORS[index % COLORS.length]
    }));
  }, [data, COLORS]);

  const handleClick = (data) => {
    if (onChartClick) {
      onChartClick(data);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bookings by Status
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
            <Typography>Loading...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Bookings Breakdown by Status
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
                No booking data available
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={handleClick}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={CustomTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Click on segments to drill down into detailed data
        </Typography>
      </CardContent>
    </Card>
  );
}

export default BookingsPieChart;
