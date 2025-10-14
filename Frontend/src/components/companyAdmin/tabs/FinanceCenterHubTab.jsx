import { useEffect, useState, useCallback } from 'react';
import {
  Card, CardContent, Typography, Grid, Box, Button, TextField, 
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab
} from '@mui/material';
import {
  AttachMoney as MoneyIcon, TrendingUp as TrendIcon, Assessment as ReportIcon,
  Receipt as ReceiptIcon, CreditCard as CardIcon, AccountBalance as BankIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import SummaryCards from '../components/SummaryCards';
import RevenueByDayTable from '../components/RevenueByDayTable';
import RevenueByRouteChart from '../components/RevenueByRouteChart';
import ExpensesTable from '../components/ExpensesTable';
import PaymentsTable from '../components/PaymentsTable';
import FinanceBookingsTable from '../components/FinanceBookingsTable';

export default function FinanceCenterHubTab() {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'month',
    dateFrom: '',
    dateTo: '',
    route: '',
    status: ''
  });

  // Data states
  const [financeData, setFinanceData] = useState({
    revenueByDay: [],
    revenueByRoute: [],
    expenses: [],
    payments: [],
    bookings: []
  });

  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalRevenue: 0,
    overduePayments: 0,
    pendingPayments: 0,
    topRoute: ''
  });

  const loadFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const { startDate, endDate } = getDateRange(filters.dateRange, filters.dateFrom, filters.dateTo);

      // Load bookings for revenue calculation
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_datetime,
          status,
          passenger_name,
          trip:trip_id(
            route:route_id(pick_up, drop_off)
          )
        `)
        .eq('company_id', companyId)
        .gte('booking_datetime', startDate)
        .lte('booking_datetime', endDate);

      // Load payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          id,
          booking_id,
          status,
          amount,
          created_at,
          booking:booking_id(passenger_name)
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Load expenses (maintenance + fuel)
      const { data: maintenanceExpenses } = await supabase
        .from('maintenance_logs')
        .select('cost, type, date')
        .eq('company_id', companyId)
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: fuelExpenses } = await supabase
        .from('fuel_logs')
        .select('cost, date, bus_name')
        .eq('company_id', companyId)
        .gte('date', startDate)
        .lte('date', endDate);

      // Process data
      const processedData = {
        revenueByDay: processRevenueByDay(bookingsData),
        revenueByRoute: processRevenueByRoute(bookingsData),
        expenses: processExpenses(maintenanceExpenses, fuelExpenses),
        payments: paymentsData || [],
        bookings: bookingsData || []
      };

      setFinanceData(processedData);
      calculateSummaryMetrics(processedData);
    } catch (error) {
      console.error('Error loading finance data:', error);
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

  const processRevenueByDay = (bookings) => {
    const dailyRevenue = {};
    
    bookings?.filter(b => b.status === 'Confirmed').forEach(booking => {
      const date = new Date(booking.booking_datetime).toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { date, bookings: 0, revenue: 0 };
      }
      dailyRevenue[date].bookings += 1;
      dailyRevenue[date].revenue += 25; // Mock $25 per booking
    });

    return Object.values(dailyRevenue).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const processRevenueByRoute = (bookings) => {
    const routeRevenue = {};
    
    bookings?.filter(b => b.status === 'Confirmed').forEach(booking => {
      const route = booking.trip?.route ? 
        `${booking.trip.route.pick_up} → ${booking.trip.route.drop_off}` : 
        'Unknown Route';
      
      routeRevenue[route] = (routeRevenue[route] || 0) + 25; // Mock $25 per booking
    });

    return Object.entries(routeRevenue)
      .map(([route, revenue]) => ({ route, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const processExpenses = (maintenance, fuel) => {
    const expenses = [];
    
    maintenance?.forEach(expense => {
      expenses.push({
        id: `maint_${Math.random()}`,
        category: `Maintenance (${expense.type})`,
        amount: parseFloat(expense.cost) || 0,
        date: expense.date,
        notes: `${expense.type} maintenance`
      });
    });

    fuel?.forEach(expense => {
      expenses.push({
        id: `fuel_${Math.random()}`,
        category: 'Fuel',
        amount: parseFloat(expense.cost) || 0,
        date: expense.date,
        notes: `Fuel for ${expense.bus_name}`
      });
    });

    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const calculateSummaryMetrics = (data) => {
    const totalRevenue = data.revenueByDay.reduce((sum, day) => sum + day.revenue, 0);
    const pendingPayments = data.payments.filter(p => p.status === 'Pending').length;
    const overduePayments = data.payments.filter(p => p.status === 'Failed').length;
    const topRoute = data.revenueByRoute[0]?.route || 'No data';

    setSummaryMetrics({
      totalRevenue,
      overduePayments,
      pendingPayments,
      topRoute
    });
  };

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    // Mock export functionality
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Revenue,Bookings\n"
      + financeData.revenueByDay.map(day => `${day.date},${day.revenue},${day.bookings}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Finance Center
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadFinanceData}
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

      {/* Summary Cards */}
      <SummaryCards metrics={summaryMetrics} loading={loading} />

      {/* Tabs for different sections */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Revenue" />
            <Tab label="Expenses" />
            <Tab label="Payments" />
            <Tab label="Bookings" />
          </Tabs>
        </Box>

        {/* Revenue Tab */}
        {tabValue === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <RevenueByDayTable 
                  data={financeData.revenueByDay} 
                  loading={loading}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <RevenueByRouteChart 
                  data={financeData.revenueByRoute} 
                  loading={loading}
                />
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Expenses Tab */}
        {tabValue === 1 && (
          <CardContent>
            <ExpensesTable 
              data={financeData.expenses} 
              loading={loading}
            />
          </CardContent>
        )}

        {/* Payments Tab */}
        {tabValue === 2 && (
          <CardContent>
            <PaymentsTable 
              data={financeData.payments} 
              loading={loading}
            />
          </CardContent>
        )}

        {/* Bookings Tab */}
        {tabValue === 3 && (
          <CardContent>
            <FinanceBookingsTable 
              data={financeData.bookings} 
              loading={loading}
            />
          </CardContent>
        )}
      </Card>
    </Box>
  );
}
