import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, MenuItem, Alert } from '@mui/material';
import { supabase } from '../supabase/client';
import { createBooking, getCompaniesLight } from '../supabase/api';
import { useAuth } from '../hooks/useAuth';
import { seedMockUsers } from '../mocks/mockAuthUsers';
import { useNavigate } from 'react-router-dom';
// Removed bcrypt fallback: switch to pure Supabase Auth for all users
import { testSupabaseConnection, testCreateDeveloper } from '../utils/testSupabase';

// Companies will be loaded dynamically

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'booking_officer', label: 'Booking Officer' },
  { value: 'boarding_operator', label: 'Boarding Operator' },
  { value: 'driver', label: 'Driver' },
  { value: 'ops_manager', label: 'Operations Manager' },
  { value: 'depot_manager', label: 'Depot Manager' },
  { value: 'maintenance_manager', label: 'Maintenance Manager' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'setup_dev', label: 'Set up dev' },
];

export default function EntryPoint() {
  const [booking, setBooking] = useState({ from: '', to: '', date: '', name: '', contact: '', company_id: '' });
  const [companies, setCompanies] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [login, setLogin] = useState({ email: '', password: '', role: '' });
  const [loginError, setLoginError] = useState(null);
  const [showDevForm, setShowDevForm] = useState(false);
  const [devForm, setDevForm] = useState({ name: '', email: '', password: '' });
  const [devSuccess, setDevSuccess] = useState(null);
  const [devError, setDevError] = useState(null);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth(navigate);

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

  const USE_TEST_LOGIN = String(process.env.REACT_APP_USE_TEST_LOGIN || '').toLowerCase() === 'true';

  // Auth Login Submit (test mode or Supabase Auth)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    const email = (login.email || '').trim().toLowerCase();
    const password = login.password || '';

    const routeByRole = (role) => {
      switch (role) {
        case 'admin': navigate('/admin-dashboard'); return;
        case 'booking_officer': navigate('/booking-dashboard'); return;
        case 'boarding_operator': navigate('/boarding-operator-dashboard'); return;
        case 'driver': navigate('/driver-dashboard'); return;
        case 'ops_manager': navigate('/ops-dashboard'); return;
        case 'developer': navigate('/developer-dashboard'); return;
        default: navigate('/'); return;
      }
    };

    const setSessionFromProfile = (profile) => {
      try {
        window.userId = profile.user_id;
        window.companyId = profile.company_id;
        window.userRole = profile.role;
        window.user = { id: profile.user_id, role: profile.role, company_id: profile.company_id, name: profile.name || '' };
        localStorage.setItem('userRole', profile.role || '');
        localStorage.setItem('companyId', profile.company_id || '');
        localStorage.setItem('userId', profile.user_id || '');
      } catch {}
    };

    try { seedMockUsers(); } catch {}
    try { await authLogin(email, password, login.role, null, true); } catch (err) { setLoginError(err.message || 'Login failed'); }
  };

  // Show dev form when role is 'setup_dev'
  useEffect(() => {
    setShowDevForm(login.role === 'setup_dev');
  }, [login.role]);

  const handleDevSubmit = async (e) => {
    e.preventDefault();
    setDevError(null);
    
    console.log('Attempting to create developer:', devForm);
    
    try {
      // Test the connection first
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        setDevError(`Database connection failed: ${connectionTest.error}`);
        return;
      }
      
      // Test developer creation
      const createTest = await testCreateDeveloper(devForm.name, devForm.email, devForm.password);
      if (!createTest.success) {
        setDevError(createTest.error);
        return;
      }
      
      setDevSuccess('Developer account created. Please check your email to verify, then log in.');
      setDevForm({ name: '', email: '', password: '' });
    } catch (err) {
      console.error('Developer creation error:', err);
      setDevError(`Error saving credentials: ${err.message}`);
    }
  };

  const handleShowDevForm = () => setShowDevForm(true);
  const handleHideDevForm = () => setShowDevForm(false);
  
  useEffect(() => {
    // Load companies dynamically
    getCompaniesLight().then(res => setCompanies(res.data || []));
  }, []);
  
  const handleTestConnection = async () => {
    console.log('Testing Supabase connection...');
    const result = await testSupabaseConnection();
    console.log('Connection test result:', result);
    if (result.success) {
      alert(`Connection successful! Found ${result.users?.length || 0} users in database.`);
    } else {
      alert(`Connection failed: ${result.error}`);
    }
  };

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
        <Paper sx={{ width: '100%', maxWidth: 520, p: { xs: 2.5, sm: 4 }, ml: { md: 4 }, boxShadow: 4 }} elevation={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ flexGrow: 1 }}>Company & Staff Login</Typography>
            <Button variant="text" color="secondary" onClick={handleShowDevForm} sx={{ textTransform: 'none' }}>Developer Setup</Button>
            <Button variant="text" color="primary" onClick={handleTestConnection} sx={{ textTransform: 'none', ml: 1 }}>Test DB</Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Login to access your company dashboard and manage operations.
          </Typography>
          {!showDevForm && (
            <form onSubmit={handleLogin}>
              <TextField label="Email" type="email" fullWidth margin="normal" value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
              <TextField label="Password" type="password" fullWidth margin="normal" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
              <TextField select label="Role" fullWidth margin="normal" value={login.role} onChange={e => setLogin({ ...login, role: e.target.value })} sx={{ '& .MuiSelect-select': { fontSize: { xs: 14, sm: 16 } } }} SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }}>
                {roles.map(r => (
                  <MenuItem key={r.value} value={r.value} sx={{ fontSize: { xs: 14, sm: 16 } }}>{r.label}</MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, py: { xs: 1, sm: 1.25 }, fontSize: { xs: 14, sm: 16 } }}>Login</Button>
            </form>
          )}
          {showDevForm && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ flexGrow: 1 }}>Developer Setup</Typography>
                <Button variant="text" color="primary" onClick={handleHideDevForm} sx={{ textTransform: 'none' }}>Back to Login</Button>
              </Box>
              <form onSubmit={handleDevSubmit}>
                <TextField label="Name" fullWidth margin="normal" value={devForm.name} onChange={e => setDevForm({ ...devForm, name: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
                <TextField label="Email" type="email" fullWidth margin="normal" value={devForm.email} onChange={e => setDevForm({ ...devForm, email: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
                <TextField label="Password" type="password" fullWidth margin="normal" value={devForm.password} onChange={e => setDevForm({ ...devForm, password: e.target.value })} required sx={{ '& .MuiInputBase-input': { fontSize: { xs: 14, sm: 16 } } }} />
                <Button type="submit" variant="contained" color="secondary" fullWidth sx={{ mt: 2, py: { xs: 1, sm: 1.25 }, fontSize: { xs: 14, sm: 16 } }}>Save Developer</Button>
              </form>
              {devSuccess && <Alert severity="success" sx={{ mt: 2 }}>{devSuccess}</Alert>}
              {devError && <Alert severity="error" sx={{ mt: 2 }}>{devError}</Alert>}
            </Box>
          )}
          {loginError && <Alert severity="error" sx={{ mt: 2 }}>{loginError}</Alert>}
        </Paper>
      </Box>
      <Box sx={{ textAlign: 'center', mt: 8, color: 'grey.700' }}>
        <Typography variant="body2">&copy; {new Date().getFullYear()} Bus Management System. All rights reserved.</Typography>
      </Box>
    </Box>
  );
}
