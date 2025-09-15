import { supabase } from './client';

export function subscribeToTrips(callback) {
  return supabase.channel('trips').on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, payload => {
    callback(payload);
  }).subscribe();
}
export function subscribeToBuses(callback) {
  return supabase.channel('buses').on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToDrivers(callback) {
  return supabase.channel('drivers').on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToIncidents(callback) {
  return supabase.channel('incidents').on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToRoutes(callback) {
  return supabase.channel('routes').on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToBookings(callback) {
  return supabase.channel('bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToMessages(callback) {
  return supabase.channel('messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToDocuments(callback) {
  return supabase.channel('documents').on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToAnnouncements(callback) {
  return supabase.channel('announcements').on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToActivityLog(callback) {
  return supabase.channel('activity_log').on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, payload => {
    callback(payload);
  }).subscribe();
}

export function subscribeToSupportTickets(callback) {
  return supabase.channel('support_tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, payload => {
    callback(payload);
  }).subscribe();
}