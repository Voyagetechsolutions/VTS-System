import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Alert,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab
} from '@mui/material';
import {
  Assessment as ReportsIcon, GetApp as ExportIcon, Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import ReportsKPIs from '../components/ReportsKPIs';
import BookingsPieChart from '../components/BookingsPieChart';
import RevenueBarChart from '../components/RevenueBarChart';
import TripPerformanceChart from '../components/TripPerformanceChart';
import PassengersChart from '../components/PassengersChart';
import ExpensesChart from '../components/ExpensesChart';
import ReportsTable from '../components/ReportsTable';

export default function ReportsHubTab() {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedChart, setSelectedChart] = useState(null);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'month', // today, week, month, custom
    dateFrom: '',
    dateTo: '',
    branch: '',
    route: '',
    bus: ''
  });

  // Data states
  const [reportData, setReportData] = useState({
    bookings: [],
    trips: [],
    revenue: [],
    expenses: [],
    passengers: []
  });

  // KPI metrics
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    averageDelay: 0,
    cancellationRate: 0
  });

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const { startDate, endDate } = getDateRange(filters.dateRange, filters.dateFrom, filters.dateTo);

      // Load bookings data
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          booking_datetime,
          branch:branch_id(name),
          trip:trip_id(
            route:route_id(pick_up, drop_off)
          )
        `)
        .eq('company_id', companyId)
        .gte('booking_datetime', startDate)
        .lte('booking_datetime', endDate);

      // Load trips data for performance metrics
      const { data: tripsData } = await supabase
        .from('trips')
        .select(`
          id,
          departure,
          arrival,
          status,
          route:route_id(pick_up, drop_off),
          bus:bus_id(name)
        `)
        .eq('company_id', companyId)
        .gte('departure', startDate)
        .lte('departure', endDate);

      // Load maintenance expenses
      const { data: maintenanceData } = await supabase
        .from('maintenance_logs')
        .select('cost, type, date')
        .eq('company_id', companyId)
        .gte('date', startDate)
        .lte('date', endDate);

      // Load fuel expenses
      const { data: fuelData } = await supabase
        .from('fuel_logs')
        .select('cost, date, bus_name')
        .eq('company_id', companyId)
        .gte('date', startDate)
        .lte('date', endDate);

      setReportData({
        bookings: bookingsData || [],
        trips: tripsData || [],
        revenue: bookingsData || [], // Mock revenue from bookings
        expenses: [...(maintenanceData || []), ...(fuelData || [])],
        passengers: bookingsData || []
      });

      calculateMetrics(bookingsData, tripsData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, filters]);

  const getDateRange = (range, customFrom, customTo) => {
    const now = new Date();
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'custom':
        startDate = customFrom ? new Date(customFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = customTo ? new Date(customTo) : now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  const calculateMetrics = (bookings, trips) => {
    const totalBookings = bookings?.length || 0;
    const confirmedBookings = bookings?.filter(b => b.status === 'Confirmed').length || 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'Cancelled').length || 0;
    
    const totalRevenue = confirmedBookings * 25; // Mock $25 per booking
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
    
    // Mock delay calculation
    const averageDelay = Math.random() * 15; // 0-15 minutes average delay

    setMetrics({
      totalBookings,
      totalRevenue,
      averageDelay,
      cancellationRate
    });
  };

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleChartClick = (chartType, data) => {
    setSelectedChart({ type: chartType, data });
    setTabValue(1); // Switch to drill-down table tab
  };

  const handleExport = () => {
    // Mock export functionality
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Type,Value,Date\n"
      + reportData.bookings.map(b => `Booking,${b.status},${b.booking_datetime}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadReportData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {filters.dateRange === 'custom' && (
              <>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="From Date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="To Date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* KPIs */}
      <ReportsKPIs metrics={metrics} loading={loading} />

      {/* Tabs for Charts and Drill-down */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Analytics Charts" />
            <Tab label="Detailed Data" />
          </Tabs>
        </Box>

        {/* Charts Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              {/* Bookings Breakdown */}
              <Grid item xs={12} md={6}>
                <BookingsPieChart 
                  data={reportData.bookings} 
                  onChartClick={(data) => handleChartClick('bookings', data)}
                />
              </Grid>

              {/* Revenue Breakdown */}
              <Grid item xs={12} md={6}>
                <RevenueBarChart 
                  data={reportData.revenue} 
                  onChartClick={(data) => handleChartClick('revenue', data)}
                />
              </Grid>

              {/* Trip Performance */}
              <Grid item xs={12} md={6}>
                <TripPerformanceChart 
                  data={reportData.trips} 
                  onChartClick={(data) => handleChartClick('trips', data)}
                />
              </Grid>

              {/* Passenger Statistics */}
              <Grid item xs={12} md={6}>
                <PassengersChart 
                  data={reportData.passengers} 
                  onChartClick={(data) => handleChartClick('passengers', data)}
                />
              </Grid>

              {/* Expenses Chart */}
              <Grid item xs={12}>
                <ExpensesChart 
                  data={reportData.expenses} 
                  onChartClick={(data) => handleChartClick('expenses', data)}
                />
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Drill-down Table Tab */}
        {tabValue === 1 && (
          <CardContent>
            <ReportsTable 
              selectedChart={selectedChart}
              reportData={reportData}
              loading={loading}
            />
          </CardContent>
        )}
      </Card>
    </Box>
  );
}
