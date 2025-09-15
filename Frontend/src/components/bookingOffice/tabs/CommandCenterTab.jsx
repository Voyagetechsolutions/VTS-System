import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography, Button } from '@mui/material';
import DashboardCard, { StatsCard, QuickActionCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { startBackgroundSync, flushQueue } from '../../../utils/offlineQueue';
import { createBooking } from '../../../supabase/api';
import BookingWizard from './BookingWizard';
import UpcomingTripsCalendar from './UpcomingTripsCalendar';
import { supabase } from '../../../supabase/client';

export default function CommandCenterTab() {
  const [kpis, setKpis] = useState({ tickets: 0, revenue: 0, refunds: 0, boarded: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTripPrefill, setWizardTripPrefill] = useState({ id: null, seats: [] });
  const branchId = window.userBranchId || localStorage.getItem('branchId') || null;
  const companyId = window.companyId || localStorage.getItem('companyId') || null;

  const loadKPIs = async () => {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const [b, p, r, c] = await Promise.all([
      supabase.from('bookings').select('booking_id').eq('company_id', companyId).eq('branch_id', branchId).gte('booking_date', start.toISOString()).lte('booking_date', end.toISOString()),
      supabase.from('payments').select('amount').eq('company_id', companyId).eq('branch_id', branchId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('refunds').select('id').eq('company_id', companyId).eq('branch_id', branchId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('bookings').select('booking_id').eq('company_id', companyId).eq('branch_id', branchId).eq('status','CheckedIn').gte('updated_at', start.toISOString()).lte('updated_at', end.toISOString()),
    ]);
    const revenue = (p.data || []).reduce((s, x) => s + Number(x.amount || 0), 0);
    setKpis({ tickets: (b.data||[]).length, revenue, refunds: (r.data||[]).length, boarded: (c.data||[]).length });
  };

  const loadUpcomingTrips = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('trips_with_details')
      .select('trip_id, route_name, departure_time, capacity, passenger_count, status, branch_id')
      .eq('company_id', companyId)
      .eq('branch_id', branchId)
      .gte('departure_time', now)
      .order('departure_time', { ascending: true })
      .limit(10);
    setUpcoming(data || []);
  };

  const loadAlerts = () => {
    const alerts = [];
    (upcoming||[]).forEach(t => {
      const occ = t.capacity ? Math.round((t.passenger_count||0) / t.capacity * 100) : 0;
      if (occ > 100) alerts.push({ created_at: new Date().toISOString(), type: 'overbooked', message: `Trip ${t.trip_id} overbooked (${occ}%)` });
      if ((t.status||'').toLowerCase() === 'delayed') alerts.push({ created_at: new Date().toISOString(), type: 'delay', message: `Trip ${t.trip_id} is delayed` });
    });
    setAlerts(alerts);
  };

  useEffect(() => { loadKPIs(); loadUpcomingTrips(); }, [branchId, companyId]);
  useEffect(() => { loadAlerts(); }, [upcoming]);
  useEffect(() => {
    // background sync for offline queued bookings
    startBackgroundSync({
      async create_booking(payload) { await createBooking(payload); },
      async create_booking_with_payment({ booking, payment }) {
        const { data, error } = await createBooking(booking);
        if (error) throw error;
        let bookingId = null;
        if (Array.isArray(data) && data[0]?.booking_id) bookingId = data[0].booking_id;
        else if (data?.booking_id) bookingId = data.booking_id;
        if (bookingId && payment?.amount) {
          await supabase.from('payments').insert([{ company_id: window.companyId, booking_id: bookingId, amount: Number(payment.amount||0), payment_method: payment.method || 'cash', status: Number(payment.amount||0) >= 0 ? 'partial' : 'unpaid' }]);
        }
      }
    }, 30000);
    return () => { try { startBackgroundSync({}, 0); } catch {} };
  }, []);

  const actions = [
    { label: 'New Booking', icon: 'add', onClick: () => { setWizardTripPrefill({ id: null, seats: [] }); setWizardOpen(true); } },
    { label: 'Manage Bookings', icon: 'tickets', onClick: () => window.location.hash = '#/booking-office/bookings' },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Tickets Sold Today" value={kpis.tickets} icon="tickets" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Revenue Collected" value={`$${Number(kpis.revenue||0).toLocaleString()}`} icon="revenue" color="success" /></Grid>
          {/* Refunds Issued removed */}
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Passengers Boarded" value={kpis.boarded} icon="passengers" color="info" /></Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4}>
        <QuickActionCard title="Quick Actions" actions={actions} />
      </Grid>
      <Grid item xs={12} md={8}>
        <DashboardCard title="Upcoming Trips" variant="outlined">
          <UpcomingTripsCalendar companyId={companyId} branchId={branchId} onBook={({ trip, seats }) => { setWizardTripPrefill({ id: trip.trip_id, seats: seats || [] }); setWizardOpen(true); }} />
        </DashboardCard>
      </Grid>

      {/* Alerts & Feed removed */}

      {/* Quick booking removed; use wizard */}

      <BookingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} initialTripId={wizardTripPrefill.id} initialStep={wizardTripPrefill.seats?.length ? 2 : 1} initialSeats={wizardTripPrefill.seats || []} />
    </Grid>
  );
}
