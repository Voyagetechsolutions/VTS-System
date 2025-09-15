import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Alert, Select, MenuItem } from '@mui/material';
import { supabase } from '../../../supabase/client';
import { createBooking, computeDynamicPrice, applyPromo } from '../../../supabase/api';
import { enqueue } from '../../../utils/offlineQueue';

export default function NewBookingTab() {
  const [form, setForm] = useState({ route_id: '', trip_id: '', seat_number: '', passenger_name: '', phone: '', promo: '', loyaltyRedeem: 0, method: 'cash' });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [suggestedSeats, setSuggestedSeats] = useState([]);
  const [takenSeats, setTakenSeats] = useState(new Set());
  const [capacity, setCapacity] = useState(50);
  const [price, setPrice] = useState({ base: 0, dynamic: 0, discount: 0, total: 0 });
  const [payNow, setPayNow] = useState(0);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('routes').select('route_id, name').eq('company_id', window.companyId).order('name');
    setRoutes(data || []);
  })(); }, []);
  useEffect(() => { (async () => {
    if (!form.route_id) { setTrips([]); return; }
    const { data } = await supabase.from('trips').select('trip_id, departure_time, capacity').eq('route_id', form.route_id).gte('departure_time', new Date().toISOString()).order('departure_time');
    setTrips(data || []);
  })(); }, [form.route_id]);

  const loadSeatSuggestions = async () => {
    if (!form.trip_id) return;
    const { data } = await supabase.from('bookings').select('seat_number').eq('trip_id', form.trip_id);
    const taken = new Set((data||[]).map(b => Number(b.seat_number)));
    const cap = (trips.find(t => t.trip_id === form.trip_id)?.capacity) || 50;
    setTakenSeats(taken);
    setCapacity(cap);
    // simple heuristic: cluster pairs, keep accessibility seats (1,2 front) open unless requested
    const candidates = [];
    for (let s = 1; s <= cap; s += 1) {
      if (!taken.has(s)) candidates.push(s);
    }
    // Prefer contiguous seats (even-odd pairs), then window (1, cap), then center
    const pairs = [];
    for (let i = 0; i < candidates.length - 1; i += 1) {
      if (candidates[i+1] === candidates[i] + 1) pairs.push([candidates[i], candidates[i+1]]);
    }
    const bestSingles = candidates.sort((a,b) => (a===1||a===cap?-1:0) - (b===1||b===cap?-1:0));
    const suggestions = [];
    if (pairs.length) { suggestions.push(...pairs.slice(0, 3).flat()); }
    suggestions.push(...bestSingles.slice(0, 6));
    setSuggestedSeats(Array.from(new Set(suggestions)).slice(0, 8));
  };

  const recalcPrice = async () => {
    try {
      const base = 10; // placeholder
      let dynamic = base;
      if (form.route_id) {
        const r = await computeDynamicPrice(form.route_id, base);
        dynamic = Number(r.data || base);
      }
      let discount = 0;
      if (form.promo) {
        const ap = await applyPromo(form.promo, dynamic);
        discount += Number(ap.data?.discount || 0);
      }
      if (form.loyaltyRedeem) {
        discount += Number(form.loyaltyRedeem || 0);
      }
      const total = Math.max(0, dynamic - discount);
      setPrice({ base, dynamic, discount, total });
    } catch {}
  };
  useEffect(() => { recalcPrice(); }, [form.route_id, form.promo, form.loyaltyRedeem]);

  const seatGrid = useMemo(() => {
    const cols = 4; // simple 2x2 aisle per row
    const items = [];
    for (let s = 1; s <= capacity; s += 1) {
      items.push(s);
    }
    return items;
  }, [capacity]);

  const runFraudChecks = async () => {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      let suspicious = [];
      if (form.phone) {
        const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('phone', form.phone).gte('booking_date', hourAgo);
        if ((count || 0) >= 3) suspicious.push('Multiple recent bookings with same phone');
        const { data: cust } = await supabase.from('customers').select('is_blacklisted').eq('phone', form.phone).maybeSingle();
        if (cust?.is_blacklisted) suspicious.push('Customer is blacklisted');
      }
      if (price.discount > price.dynamic * 0.5) {
        suspicious.push('High discount vs price');
      }
      if (suspicious.length) {
        await supabase.from('activity_log').insert([{ company_id: window.companyId, type: 'fraud_alert', message: JSON.stringify({ warnings: suspicious, phone: form.phone, trip_id: form.trip_id }) }]);
        return window.confirm(`Suspicious booking detected:\n- ${suspicious.join('\n- ')}\nProceed?`);
      }
      return true;
    } catch { return true; }
  };

  const submit = async (e) => {
    e.preventDefault(); setMsg(null); setErr(null);
    const payload = {
      company_id: Number(window.companyId),
      trip_id: form.trip_id,
      passenger_name: form.passenger_name,
      phone: form.phone,
      seat_number: Number(form.seat_number),
      payment_status: price.total === 0 ? 'paid' : 'unpaid',
      source: 'counter',
    };
    try {
      const ok = await runFraudChecks();
      if (!ok) return;
      const { data, error } = await createBooking(payload);
      if (error) throw error;
      let bookingId = null;
      if (Array.isArray(data) && data[0]?.booking_id) bookingId = data[0].booking_id;
      else if (data?.booking_id) bookingId = data.booking_id;
      setMsg(`Created booking ${bookingId || ''}`);
      // partial payment
      const payAmount = Number(payNow || 0);
      if (payAmount > 0 && bookingId) {
        const status = payAmount >= price.total ? 'paid' : 'partial';
        await supabase.from('payments').insert([{ company_id: window.companyId, booking_id: bookingId, amount: payAmount, payment_method: form.method, status }]);
      }
    } catch (ex) {
      // offline fallback
      const payAmount = Number(payNow || 0);
      if (payAmount > 0) enqueue({ type: 'create_booking_with_payment', payload: { booking: payload, payment: { amount: payAmount, method: form.method } } });
      else enqueue({ type: 'create_booking', payload });
      setMsg('Offline: queued booking for sync');
    }
  };

  return null;
}


