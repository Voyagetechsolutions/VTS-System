import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, MenuItem, Alert } from '@mui/material';
import { createBooking, getCompaniesLight } from '../supabase/api';

// Companies will be loaded dynamically

// Auth-related UI removed per request

export default function EntryPoint() {
  const [booking, setBooking] = useState({ from: '', to: '', date: '', name: '', contact: '', company_id: '' });
  const [companies, setCompanies] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Universal Booking Form Submit
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!booking.company_id) {
      setBookingError('Please select a company.');
      return;
    }
    // Only allow valid company_id
    const validCompany = companies.find(c => c.company_id === Number(booking.company_id));
    if (!validCompany) {
      setBookingError('Invalid company selected.');
      return;
    }
    const { data, error } = await createBooking({
      ...booking,
      company_id: Number(booking.company_id),
      status: 'Pending',
    });
    if (error) {
      setBookingError(error.message);
    } else {
      setBookingSuccess(`Booking successful! Reference: ${data?.[0]?.booking_id || 'N/A'}`);
      setBooking({ from: '', to: '', date: '', name: '', contact: '', company_id: '' });
      setBookingError(null);
    }
  };

  // All authentication-related handlers removed per request
  
  useEffect(() => {
    // Load companies dynamically
    getCompaniesLight().then(res => setCompanies(res.data || []));
  }, []);
  
  // Connection test removed since it used auth token

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ bgcolor: '#1976d2', color: 'white', py: { xs: 3, sm: 4 }, textAlign: 'center', px: 2 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>Bus Management System</Typography>
        <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>Multi-tenant SaaS for Bus Companies, Staff, and Customers</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: { xs: 3, sm: 6 }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 }, px: { xs: 2, sm: 3 } }}>
        <Paper sx={{ width: '100%', maxWidth: 520, p: { xs: 2.5, sm: 4 }, mr: { md: 4 }, boxShadow: 4 }} elevation={3}>
          <Typography variant="h5" gutterBottom>Book Your Bus Trip</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Find and book a seat on any participating company. No login required!
          </Typography>
          <form onSubmit={handleBooking}>
            <TextField label="From" fullWidth margin="normal" value={booking.from} onChange={e => setBooking({ ...booking, from: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
            <TextField label="To" fullWidth margin="normal" value={booking.to} onChange={e => setBooking({ ...booking, to: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
            <TextField label="Date" type="date" fullWidth margin="normal" value={booking.date} onChange={e => setBooking({ ...booking, date: e.target.value })} InputLabelProps={{ shrink: true }} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
            <TextField label="Passenger Name" fullWidth margin="normal" value={booking.name} onChange={e => setBooking({ ...booking, name: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
            <TextField label="Passenger Phone/Email" fullWidth margin="normal" value={booking.contact} onChange={e => setBooking({ ...booking, contact: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
            <TextField select label="Company" fullWidth margin="normal" value={booking.company_id} onChange={e => setBooking({ ...booking, company_id: e.target.value })} required sx={{ '& .MuiSelect-select': { fontSize: { xs: 14, sm: 16 } } }} SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }}>
              {companies.map(c => (
                <MenuItem key={c.company_id} value={c.company_id} sx={{ fontSize: { xs: 14, sm: 16 } }}>{c.name}</MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, py: { xs: 1, sm: 1.25 }, fontSize: { xs: 14, sm: 16 } }}>Book Now</Button>
          </form>
          {bookingSuccess && <Alert severity="success" sx={{ mt: 2 }}>{bookingSuccess}</Alert>}
          {bookingError && <Alert severity="error" sx={{ mt: 2 }}>{bookingError}</Alert>}
        </Paper>
        {/* Authentication panel removed per request */}
      </Box>
      <Box sx={{ textAlign: 'center', mt: 8, color: 'grey.700' }}>
        <Typography variant="body2">&copy; {new Date().getFullYear()} Bus Management System. All rights reserved.</Typography>
      </Box>
    </Box>
  );
}
