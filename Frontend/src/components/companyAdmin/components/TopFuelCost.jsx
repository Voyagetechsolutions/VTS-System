import { useMemo } from 'react';
import {
  Card, CardContent, Typography, List, ListItem, ListItemText, Box, Chip
} from '@mui/material';
import { LocalGasStation as FuelIcon } from '@mui/icons-material';

export default function TopFuelCost({ fuelLogs }) {
  const topFuelCostByBus = useMemo(() => {
    if (!fuelLogs || fuelLogs.length === 0) return [];

    // Group by bus and calculate total cost
    const busGroups = fuelLogs.reduce((acc, log) => {
      const busKey = log.bus_name || 'Unknown Bus';
      if (!acc[busKey]) {
        acc[busKey] = {
          busName: busKey,
          totalCost: 0,
          totalLiters: 0,
          recordCount: 0
        };
      }
      acc[busKey].totalCost += parseFloat(log.cost) || 0;
      acc[busKey].totalLiters += parseFloat(log.liters) || 0;
      acc[busKey].recordCount += 1;
      return acc;
    }, {});

    // Convert to array and sort by total cost
    return Object.values(busGroups)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5); // Top 5
  }, [fuelLogs]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatLiters = (liters) => {
    return `${parseFloat(liters).toFixed(1)}L`;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FuelIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Top Fuel Cost by Bus</Typography>
        </Box>

        {topFuelCostByBus.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No fuel data available
          </Typography>
        ) : (
          <List dense>
            {topFuelCostByBus.map((bus, index) => (
              <ListItem key={bus.busName} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">
                        #{index + 1} {bus.busName}
                      </Typography>
                      <Chip 
                        label={formatCurrency(bus.totalCost)} 
                        color="primary" 
                        size="small" 
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatLiters(bus.totalLiters)} • {bus.recordCount} records
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
