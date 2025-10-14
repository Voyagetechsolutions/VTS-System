import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
        <Typography variant="body2" color="error.main">
          Cost: {formatCurrency(payload[0].value)}
        </Typography>
      </Box>
    );
  }
  return null;
};

const ExpensesChart = ({ data, onChartClick }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group expenses by type
    const expenseGroups = data.reduce((acc, expense) => {
      let type;
      if (expense.type) {
        // Maintenance expense
        type = `Maintenance (${expense.type})`;
      } else {
        // Fuel expense
        type = 'Fuel';
      }
      
      acc[type] = (acc[type] || 0) + (parseFloat(expense.cost) || 0);
      return acc;
    }, {});

    return Object.entries(expenseGroups)
      .map(([type, cost]) => ({ type, cost }))
      .sort((a, b) => b.cost - a.cost);
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
          Expenses by Type
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
                No expense data available
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer>
              <BarChart data={chartData} onClick={handleClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="type" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip content={CustomTooltip} />
                <Legend />
                <Bar 
                  dataKey="cost" 
                  fill="#FF8042" 
                  name="Total Cost"
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Total expenses breakdown by maintenance and fuel costs
        </Typography>
      </CardContent>
    </Card>
  );
}

export default ExpensesChart;
