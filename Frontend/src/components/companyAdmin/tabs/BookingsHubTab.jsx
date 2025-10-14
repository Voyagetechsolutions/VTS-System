import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Alert,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import BookingsTable from '../components/BookingsTable';
import BookingsCharts from '../components/BookingsCharts';
import BookingsKPIs from '../components/BookingsKPIs';
import AddBookingModal from '../components/AddBookingModal';

export default function BookingsHubTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showAddBooking, setShowAddBooking] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    branch: '',
    channel: '',
    dateFrom: '',
    dateTo: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    failedTransactions: 0,
    averageOccupancy: 0,
    peakHour: 'N/A'
  });

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          passenger_name,
          seat_number,
          booking_datetime,
          status,
          channel,
          branch:branch_id(name),
          trip:trip_id(
            departure,
            arrival,
            route:route_id(pick_up, drop_off),
            bus:bus_id(name, license_plate)
          ),
          created_at
        `)
        .eq('company_id', companyId)
        .order('booking_datetime', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      // Total bookings count
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Revenue calculation (mock for now - would need payments table)
      const { data: confirmedBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'Confirmed');

      const totalRevenue = (confirmedBookings?.length || 0) * 25; // Mock $25 per booking

      // Failed transactions
      const { count: failedTransactions } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'Cancelled');

      // Peak booking hour analysis
      const { data: bookingTimes } = await supabase
        .from('bookings')
        .select('booking_datetime')
        .eq('company_id', companyId);

      let peakHour = 'N/A';
      if (bookingTimes?.length > 0) {
        const hourCounts = {};
        bookingTimes.forEach(booking => {
          const hour = new Date(booking.booking_datetime).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const maxHour = Object.keys(hourCounts).reduce((a, b) => 
          hourCounts[a] > hourCounts[b] ? a : b
        );
        peakHour = `${maxHour}:00`;
      }

      setMetrics({
        totalBookings: totalBookings || 0,
        totalRevenue,
        failedTransactions: failedTransactions || 0,
        averageOccupancy: 75, // Mock data
        peakHour
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredBookings = bookings.filter(booking => {
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
      booking.passenger_name?.toLowerCase().includes(searchTerm) ||
      booking.trip?.route?.pick_up?.toLowerCase().includes(searchTerm) ||
      booking.trip?.route?.drop_off?.toLowerCase().includes(searchTerm);

    const matchesStatus = !filters.status || booking.status === filters.status;
    const matchesBranch = !filters.branch || booking.branch?.name === filters.branch;
    const matchesChannel = !filters.channel || booking.channel === filters.channel;

    const bookingDate = new Date(booking.booking_datetime);
    const matchesDateFrom = !filters.dateFrom || bookingDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || bookingDate <= new Date(filters.dateTo);

    return matchesSearch && matchesStatus && matchesBranch && matchesChannel && 
           matchesDateFrom && matchesDateTo;
  });

  const handleBookingSuccess = () => {
    setShowAddBooking(false);
    loadBookings();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Bookings Management & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddBooking(true)}
        >
          Add Booking
        </Button>
      </Box>

      {/* KPIs */}
      <BookingsKPIs metrics={metrics} />

      {/* Charts */}
      <BookingsCharts bookings={bookings} />

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search Passenger, Route, Branch"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                placeholder="Search bookings..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Confirmed">Confirmed</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Channel</InputLabel>
                <Select
                  value={filters.channel}
                  onChange={(e) => handleFilterChange('channel', e.target.value)}
                  label="Channel"
                >
                  <MenuItem value="">All Channels</MenuItem>
                  <MenuItem value="Web">Web</MenuItem>
                  <MenuItem value="App">App</MenuItem>
                  <MenuItem value="Counter">Counter</MenuItem>
                  <MenuItem value="Agent">Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
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
            <Grid item xs={12} md={3}>
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
          </Grid>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Bookings</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddBooking(true)}
              size="small"
            >
              Add Booking
            </Button>
          </Box>
          {filteredBookings.length === 0 ? (
            <Alert severity="info">
              No bookings found. Add your first booking using the "Add Booking" button.
            </Alert>
          ) : (
            <BookingsTable 
              bookings={filteredBookings} 
              loading={loading}
              onUpdate={loadBookings}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Booking Modal */}
      <AddBookingModal
        open={showAddBooking}
        onClose={() => setShowAddBooking(false)}
        onSuccess={handleBookingSuccess}
      />
    </Box>
  );
}
