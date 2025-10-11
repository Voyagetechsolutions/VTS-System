// Finance helper queries for dashboards
// Uses existing tables: bookings, routes, expenses, payments
// Import and use in finance dashboards as needed

import { supabase } from './client';

export async function getRevenueByDay() {
  const { data, error } = await supabase
    .from('bookings')
    .select('booking_date, amount_paid');
  if (error) return { data: [], error };
  const map = new Map();
  (data || []).forEach(r => {
    const key = (r.booking_date || '').slice(0, 10);
    map.set(key, (map.get(key) || 0) + (Number(r.amount_paid) || 0));
  });
  const rows = Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, total_revenue]) => ({ date, total_revenue }));
  return { data: rows };
}

export async function getRevenueByRoute() {
  const { data, error } = await supabase
    .from('bookings')
    .select('amount_paid, route_id');
  if (error) return { data: [], error };
  const routeIds = Array.from(new Set((data || []).map(d => d.route_id).filter(Boolean)));
  let nameById = new Map();
  if (routeIds.length) {
    const { data: routes } = await supabase
      .from('routes')
      .select('route_id, route_name, origin, destination')
      .in('route_id', routeIds);
    nameById = new Map((routes || []).map(r => [r.route_id, r.route_name || (r.origin && r.destination ? `${r.origin} 0 ${r.destination}` : String(r.route_id))]));
  }
  const agg = new Map();
  (data || []).forEach(b => {
    const key = nameById.get(b.route_id) || String(b.route_id || 'Unknown');
    agg.set(key, (agg.get(key) || 0) + (Number(b.amount_paid) || 0));
  });
  const rows = Array.from(agg.entries()).map(([route, revenue]) => ({ route, revenue }));
  return { data: rows };
}

export async function getExpensesByType() {
  const { data, error } = await supabase
    .from('expenses')
    .select('expense_type, amount');
  if (error) return { data: [], error };
  const map = new Map();
  (data || []).forEach(e => {
    const key = e.expense_type || 'Other';
    map.set(key, (map.get(key) || 0) + (Number(e.amount) || 0));
  });
  const rows = Array.from(map.entries()).map(([expense_type, total_spent]) => ({ expense_type, total_spent }));
  return { data: rows };
}

export async function getPaymentsList() {
  return supabase
    .from('payments')
    .select('payment_id, payer_name, payment_method, amount, date')
    .order('date', { ascending: false });
}

export async function getBookingsList() {
  return supabase
    .from('bookings')
    .select('booking_id, passenger_name, route_id, booking_date, amount_paid')
    .order('booking_date', { ascending: false });
}
