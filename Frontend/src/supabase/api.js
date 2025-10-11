import { supabase } from './client';

function getCompanyId(companyId) {
  return companyId || window.companyId || null;
}

// Route schedules CRUD (table: route_schedules)
export async function getRouteSchedulesTable(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [] };
  try {
    // route_schedules has no company_id; filter via routes belonging to the company
    const { data: routeIds, error: routesErr } = await supabase
      .from('routes')
      .select('route_id')
      .eq('company_id', cid)
      .limit(1000);
    if (routesErr) throw routesErr;
    const ids = (routeIds || []).map(r => r.route_id);
    if (ids.length === 0) return { data: [] };
    const { data, error } = await supabase
      .from('route_schedules')
      .select('*')
      .in('route_id', ids)
      .order('departure_time', { ascending: true })
      .limit(1000);
    if (error) throw error;
    return { data };
  } catch (e) {
    return { data: [], error: e };
  }
}
export async function upsertRouteScheduleTable(payload, companyId) {
  const cid = getCompanyId(companyId);
  try {
    // route_schedules has no company_id column; rely on route_id linkage
    const row = { ...payload };
    const { data, error } = await supabase
      .from('route_schedules')
      .upsert(row, { onConflict: 'id' })
      .select();
    if (error) throw error;
    return { data };
  } catch (e) {
    return { data: null, error: e };
  }
}
export async function deleteRouteScheduleById(scheduleId, companyId) {
  try {
    const { error } = await supabase
      .from('route_schedules')
      .delete()
      .eq('id', scheduleId);
    if (error) throw error;
    return { data: true };
  } catch (e) {
    return { data: false, error: e };
  }
}

// Probe DB readiness for optional modules (returns booleans per resource)
export async function getDatabaseReadiness(companyId) {
  const cid = getCompanyId(companyId);
  const probe = async (name) => {
    try {
      const { error } = await supabase.from(name).select('*', { count: 'exact', head: true }).eq('company_id', cid);
      if (error && (error.code === 'PGRST102' || error.message?.toLowerCase?.().includes('relation') )) return false; // missing relation
      return true;
    } catch { return false; }
  };
  const [opsDepot, opsMaint, opsFin, opsHR, opsAlerts, chan, shifts, sched] = await Promise.all([
    probe('ops_depot_kpis'),
    probe('ops_maintenance_kpis'),
    probe('ops_finance_kpis'),
    probe('ops_hr_kpis'),
    probe('ops_alerts_kpis'),
    probe('channel_status'),
    probe('driver_shifts'),
    probe('route_schedules'),
  ]);
  return {
    data: {
      views: { ops_depot_kpis: opsDepot, ops_maintenance_kpis: opsMaint, ops_finance_kpis: opsFin, ops_hr_kpis: opsHR, ops_alerts_kpis: opsAlerts },
      tables: { channel_status: chan, driver_shifts: shifts, route_schedules: sched },
    }
  };
}

function getBranchId() {
  try {
    return window.userBranchId || Number(localStorage.getItem('branchId')) || null;
  } catch { return null; }
}

function normalizeCompanyId(value) {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const USE_TEST_LOGIN = String(process.env.REACT_APP_USE_TEST_LOGIN || '').toLowerCase() === 'true';

// Companies CRUD
export async function getCompanies() {
  return supabase.from('companies').select('*');
}
export async function createCompany(data) {
  return supabase.from('companies').insert([data]);
}
export async function updateCompany(id, data) {
  return supabase.from('companies').update(data).eq('company_id', id);
}
export async function deleteCompany(id) {
  return supabase.from('companies').delete().eq('company_id', id);
}
export async function getCompanyBasic(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null };
  const { data, error } = await supabase.from('companies').select('company_id, name, subscription_plan, is_active').eq('company_id', cid).maybeSingle();
  return { data, error };
}
export async function getCompanySettings(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null };
  const { data, error } = await supabase.from('company_settings').select('*').eq('company_id', cid).maybeSingle();
  return { data, error };
}
export async function updateCompanySettings(update, companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { error: 'No company id' };
  const payload = { ...update, company_id: cid };
  // upsert to ensure row exists
  return supabase.from('company_settings').upsert(payload, { onConflict: 'company_id' });
}

// Company subscription helpers (used in SettingsTab)
export async function getCompanySubscription(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null };
  // Simple model: one row in subscriptions per company
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, plan, amount, status, created_at')
    .eq('company_id', cid)
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function updateSubscriptionPlan(subscriptionId, plan) {
  if (!subscriptionId) return { error: 'Missing subscription id' };
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ plan })
    .eq('id', subscriptionId)
    .select('id, plan, amount, status')
    .maybeSingle();
  return { data, error };
}

// Company Admin Dashboard APIs
export async function getCompanyKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: { users: 0, buses: 0, routes: 0, bookings: 0, revenue: 0, occupancy: 0, bookingsTrend: [], revenueTrend: [], occupancyRates: [] }, error: null };
  try {
    const [{ count: usersCount }, { count: busesCount }, { count: routesCount }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', cid),
      supabase.from('buses').select('*', { count: 'exact', head: true }).eq('company_id', cid),
      supabase.from('routes').select('*', { count: 'exact', head: true }).eq('company_id', cid),
    ]);

    // Bookings trend (last 12 months) and counts
    const { data: bookingsAll } = await supabase
      .from('bookings_with_company')
      .select('booking_id, company_id, booking_date')
      .eq('company_id', cid);
    const now = new Date();
    const months = [...Array(12)].map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const bookingsByMonth = new Map(months.map(m => [m, 0]));
    (bookingsAll || []).forEach(b => {
      const d = new Date(b.booking_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (bookingsByMonth.has(key)) bookingsByMonth.set(key, (bookingsByMonth.get(key) || 0) + 1);
    });
    const bookingsTrend = Array.from(bookingsByMonth.entries()).map(([month, bookings]) => ({ month, bookings }));
    const bookings = (bookingsAll || []).length;

    // Revenue trend (monthly)
    const { data: revenueRows } = await supabase
      .from('monthly_company_revenue')
      .select('*')
      .eq('company_id', cid)
      .order('month', { ascending: true });
    const revenueTrend = (revenueRows || []).map(r => ({ month: r.month?.slice?.(0, 7) || r.month, revenue: Number(r.revenue || 0) }));
    const revenue = (revenueTrend || []).reduce((a, b) => a + Number(b.revenue || 0), 0);

    // Occupancy (avg of trip_occupancy)
    const { data: occRows } = await supabase
      .from('trip_occupancy')
      .select('occupancy_pct')
      .eq('company_id', cid);
    const occupancy = Math.round(((occRows || []).reduce((a, b) => a + Number(b.occupancy_pct || 0), 0) / Math.max((occRows || []).length, 1)) * 10) / 10;
    const occupancyRates = (occRows || []).slice(0, 10).map((r, idx) => ({ label: `Trip ${idx + 1}`, value: Number(r.occupancy_pct || 0) }));

    return { data: { users: usersCount || 0, buses: busesCount || 0, routes: routesCount || 0, bookings, revenue, occupancy, bookingsTrend, revenueTrend, occupancyRates } };
  } catch (error) {
    return { data: { users: 0, buses: 0, routes: 0, bookings: 0, revenue: 0, occupancy: 0, bookingsTrend: [], revenueTrend: [], occupancyRates: [] }, error };
  }
}

// Global Activity Feed
export async function getGlobalActivity(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        users!activity_log_user_id_fkey(name)
      `)
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching global activity:', error);
    return { data: null, error };
  }
}

// System Health
export async function getSystemHealth(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: { apiStatus: 'healthy', apiUptime: 99.9, depotStatus: 'healthy', activeDepots: 0, totalDepots: 0, bookingStatus: 'healthy', activeBookingOffices: 0, totalBookingOffices: 0 }, error: null };
  try {
    // Get depot and booking office counts
    const [{ count: totalDepots }, { count: totalBookingOffices }] = await Promise.all([
      supabase.from('branches').select('*', { count: 'exact', head: true }).eq('company_id', cid),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', cid).eq('role', 'booking_officer')
    ]);

    // Mock system health data - in real implementation, this would check actual system status
    const healthData = {
      apiStatus: 'healthy',
      apiUptime: 99.9,
      depotStatus: 'healthy',
      activeDepots: totalDepots || 0,
      totalDepots: totalDepots || 0,
      bookingStatus: 'healthy',
      activeBookingOffices: totalBookingOffices || 0,
      totalBookingOffices: totalBookingOffices || 0
    };
    
    return { data: healthData, error: null };
  } catch (error) {
    console.error('Error fetching system health:', error);
    return { data: null, error };
  }
}

// Top Performing Routes
export async function getTopRoutes(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        route_id,
        route_name,
        trips!inner(
          bookings!inner(
            amount
          )
        )
      `)
      .eq('company_id', cid)
      .limit(10);
    
    if (error) throw error;
    
    // Process data to calculate revenue and passenger counts
    const processedData = data.map(route => {
      const totalRevenue = route.trips.reduce((sum, trip) => 
        sum + trip.bookings.reduce((tripSum, booking) => tripSum + (booking.amount || 0), 0), 0
      );
      const totalPassengers = route.trips.reduce((sum, trip) => sum + trip.bookings.length, 0);
      
      return {
        route_id: route.route_id,
        route_name: route.route_name,
        revenue: totalRevenue,
        passengers: totalPassengers
      };
    }).sort((a, b) => b.revenue - a.revenue);
    
    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching top routes:', error);
    return { data: null, error };
  }
}

// Busiest Depots
export async function getBusiestDepots(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('branches')
      .select(`
        branch_id,
        name as branch_name,
        trips!inner(
          bookings!inner(
            amount
          )
        )
      `)
      .eq('company_id', cid);
    
    if (error) throw error;
    
    // Process data to calculate trip and passenger counts
    const processedData = data.map(branch => {
      const totalTrips = branch.trips.length;
      const totalPassengers = branch.trips.reduce((sum, trip) => sum + trip.bookings.length, 0);
      
      return {
        branch_id: branch.branch_id,
        branch_name: branch.branch_name,
        trips: totalTrips,
        passengers: totalPassengers
      };
    }).sort((a, b) => b.trips - a.trips);
    
    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching busiest depots:', error);
    return { data: null, error };
  }
}

// Maintenance Alerts
export async function getMaintenanceAlerts(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        task_id as alert_id,
        buses!inner(bus_number),
        issue_type,
        priority,
        status
      `)
      .eq('company_id', cid)
      .in('priority', ['high', 'urgent'])
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    const processedData = data.map(task => ({
      alert_id: task.alert_id,
      bus_number: task.buses.bus_number,
      issue_type: task.issue_type,
      priority: task.priority
    }));
    
    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching maintenance alerts:', error);
    return { data: null, error };
  }
}

// Approval System APIs
export async function getPendingApprovals(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('company_id', cid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return { data: null, error };
  }
}

export async function approveRequest(approvalId, notes = '') {
  try {
    const { data, error } = await supabase
      .from('approvals')
      .update({ 
        status: 'approved', 
        approved_at: new Date().toISOString(),
        approval_notes: notes
      })
      .eq('approval_id', approvalId);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error approving request:', error);
    return { data: null, error };
  }
}

export async function rejectRequest(approvalId, notes = '') {
  try {
    const { data, error } = await supabase
      .from('approvals')
      .update({ 
        status: 'rejected', 
        rejected_at: new Date().toISOString(),
        rejection_notes: notes
      })
      .eq('approval_id', approvalId);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error rejecting request:', error);
    return { data: null, error };
  }
}

export async function getLargeRefunds(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('refunds')
      .select(`
        *,
        bookings!inner(
          passenger_name,
          booking_id
        )
      `)
      .eq('company_id', cid)
      .gte('amount', 1000) // Large refunds over $1000
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const processedData = data.map(refund => ({
      refund_id: refund.refund_id,
      amount: refund.amount,
      passenger_name: refund.bookings.passenger_name,
      booking_id: refund.bookings.booking_id,
      reason: refund.reason,
      created_at: refund.created_at
    }));
    
    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching large refunds:', error);
    return { data: null, error };
  }
}

export async function getRouteRequests(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('route_requests')
      .select(`
        *,
        users!route_requests_requested_by_fkey(name)
      `)
      .eq('company_id', cid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const processedData = data.map(request => ({
      request_id: request.request_id,
      route_name: request.route_name,
      action: request.action,
      requested_by: request.users.name,
      created_at: request.created_at
    }));
    
    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching route requests:', error);
    return { data: null, error };
  }
}

export async function getMaintenanceRequests(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        buses!inner(bus_number)
      `)
      .eq('company_id', cid)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const processedData = data.map(request => ({
      request_id: request.request_id,
      bus_number: request.buses.bus_number,
      work_type: request.work_type,
      estimated_cost: request.estimated_cost,
      priority: request.priority,
      created_at: request.created_at
    }));
    
    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return { data: null, error };
  }
}

export async function getHRRequests(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('hr_requests')
      .select(`
        *,
        users!hr_requests_employee_id_fkey(name as employee_name),
        users!hr_requests_requested_by_fkey(name as requested_by)
      `)
      .eq('company_id', cid)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const processedData = data.map(request => ({
      request_id: request.request_id,
      action: request.action,
      employee_name: request.employee_name,
      department: request.department,
      requested_by: request.requested_by,
      created_at: request.created_at
    }));
    
    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error fetching HR requests:', error);
    return { data: null, error };
  }
}

// Global Communications APIs
export async function getNotificationPolicies(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('notification_policies')
      .select('*')
      .eq('company_id', cid)
      .order('role', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching notification policies:', error);
    return { data: null, error };
  }
}

export async function updateNotificationPolicy(policyId, policyData) {
  try {
    const { data, error } = await supabase
      .from('notification_policies')
      .update(policyData)
      .eq('policy_id', policyId);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating notification policy:', error);
    return { data: null, error };
  }
}

export async function getMessageTemplates(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('company_id', cid)
      .order('template_name', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching message templates:', error);
    return { data: null, error };
  }
}

export async function sendGlobalMessage(messageData) {
  try {
    const { data, error } = await supabase
      .from('global_messages')
      .insert([{
        ...messageData,
        company_id: window.companyId,
        sent_by: window.userId
      }]);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error sending global message:', error);
    return { data: null, error };
  }
}

// Aggregated Admin Oversight Snapshot
export async function getAdminOversightSnapshot(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  try {
    const [
      // Booking
      bookingsTodayRes,
      largeRefundsRes,
      reconciliationRes,
      blacklistOverridesRes,
      // Boarding
      boardingIncidentsRes,
      seatUtilRes,
      boardingDelaysRes,
      // Driver
      driverTripsRes,
      driverIncidentsRes,
      driverOnTimeRes,
      expiredCertsRes,
      // Ops
      routeApprovalsRes,
      deadMileageRes,
      utilizationRes,
      // Depot
      staffShortagesRes,
      busesDownRes,
      readinessRes,
      // Maintenance
      majorApprovalsRes,
      downtimeRes,
      monthCostRes,
      // Finance
      pnlMonthRes,
      highRiskRefundsRes,
      largeExpensesRes,
      // HR
      criticalHiresRes,
      payrollAdjustmentsRes,
      turnoverRes,
      // Alerts
      escalationsRes,
      broadcastsRes,
      rulesRes
    ] = await Promise.all([
      supabase.rpc('admin_bookings_today', { company_id: cid }),
      supabase.rpc('admin_large_refunds_pending', { company_id: cid }),
      supabase.rpc('admin_reconciliation_status', { company_id: cid }),
      supabase.rpc('admin_blacklist_overrides_today', { company_id: cid }),
      supabase.rpc('admin_boarding_incidents_today', { company_id: cid }),
      supabase.rpc('admin_seat_utilization_pct', { company_id: cid }),
      supabase.rpc('admin_boarding_delays', { company_id: cid }),
      supabase.rpc('admin_driver_trip_completion', { company_id: cid }),
      supabase.rpc('admin_driver_accidents_today', { company_id: cid }),
      supabase.rpc('admin_driver_on_time_score', { company_id: cid }),
      supabase.rpc('admin_driver_expired_certs', { company_id: cid }),
      supabase.rpc('admin_route_approvals_pending', { company_id: cid }),
      supabase.rpc('admin_dead_mileage_km', { company_id: cid }),
      supabase.rpc('admin_utilization_pct', { company_id: cid }),
      supabase.rpc('admin_depot_staff_shortages', { company_id: cid }),
      supabase.rpc('admin_buses_down', { company_id: cid }),
      supabase.rpc('admin_depot_readiness_pct', { company_id: cid }),
      supabase.rpc('admin_maintenance_major_approvals', { company_id: cid }),
      supabase.rpc('admin_maintenance_downtime_pct', { company_id: cid }),
      supabase.rpc('admin_maintenance_month_cost', { company_id: cid }),
      supabase.rpc('admin_finance_pnl_month', { company_id: cid }),
      supabase.rpc('admin_finance_high_risk_refunds', { company_id: cid }),
      supabase.rpc('admin_finance_large_expenses_pending', { company_id: cid }),
      supabase.rpc('admin_hr_critical_hires', { company_id: cid }),
      supabase.rpc('admin_hr_payroll_adjustments_pending', { company_id: cid }),
      supabase.rpc('admin_hr_turnover_rate', { company_id: cid }),
      supabase.rpc('admin_alerts_escalations_today', { company_id: cid }),
      supabase.rpc('admin_alerts_broadcasts_today', { company_id: cid }),
      supabase.rpc('admin_alert_rules_count', { company_id: cid })
    ]);

    const data = {
      booking: {
        volumeToday: Number(bookingsTodayRes.data || 0),
        largeRefundsPending: Number(largeRefundsRes.data || 0),
        reconciliationStatus: reconciliationRes.data || 'OK',
        fraudAlerts: Number(highRiskRefundsRes?.data || 0),
        blacklistOverrides: Number(blacklistOverridesRes.data || 0)
      },
      boarding: {
        incidentsToday: Number(boardingIncidentsRes.data || 0),
        seatUtilizationPct: Number(seatUtilRes.data || 0),
        delays: Number(boardingDelaysRes.data || 0)
      },
      driver: {
        completionRate: Number(driverTripsRes.data || 0),
        accidents: Number(driverIncidentsRes.data || 0),
        onTimeScore: Number(driverOnTimeRes.data || 0),
        expiredCerts: Number(expiredCertsRes.data || 0)
      },
      ops: {
        routeApprovals: Number(routeApprovalsRes.data || 0),
        deadMileageKm: Number(deadMileageRes.data || 0),
        utilizationPct: Number(utilizationRes.data || 0)
      },
      depot: {
        staffShortages: Number(staffShortagesRes.data || 0),
        busesDown: Number(busesDownRes.data || 0),
        readinessPct: Number(readinessRes.data || 0)
      },
      maintenance: {
        majorApprovals: Number(majorApprovalsRes.data || 0),
        downtimePct: Number(downtimeRes.data || 0),
        monthCost: Number(monthCostRes.data || 0)
      },
      finance: {
        pnlMonth: Number(pnlMonthRes.data || 0),
        highRiskRefunds: Number(highRiskRefundsRes.data || 0),
        largeExpensesPending: Number(largeExpensesRes.data || 0)
      },
      hr: {
        criticalHires: Number(criticalHiresRes.data || 0),
        payrollAdjustments: Number(payrollAdjustmentsRes.data || 0),
        turnoverRate: Number(turnoverRes.data || 0)
      },
      alerts: {
        escalationsToday: Number(escalationsRes.data || 0),
        broadcasts: Number(broadcastsRes.data || 0),
        rules: Number(rulesRes.data || 0)
      }
    };

    return { data };
  } catch (error) {
    console.error('Error building admin oversight snapshot', error);
    return { data: null, error };
  }
}
export async function getCompanyUsers(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: [], error: null };
  return supabase.from('users').select('*').eq('company_id', cid);
}

// Command Center KPIs: Open Incidents (count unresolved)
export async function getOpenIncidentsCount(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: 0 };
  try {
    const { count, error } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', cid)
      .neq('status', 'resolved');
    if (error) throw error;
    return { data: Number(count || 0) };
  } catch (e) {
    return { data: 0, error: e };
  }
}

// Communications channel health (optional table/view: channel_status)
// Expected shape: [{ service: 'email'|'sms'|'push'|'in_app', status: 'active'|'down'|'degraded', message, updated_at }]
export async function getChannelStatus(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: { email: { status: 'active' }, sms: { status: 'active' }, push: { status: 'active' }, in_app: { status: 'active' } } };
  try {
    const { data, error } = await supabase
      .from('channel_status')
      .select('service, status, message, updated_at')
      .eq('company_id', cid);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    const map = Object.fromEntries(rows.map(r => [r.service, r]));
    return { data: map };
  } catch (e) {
    // Fallback: assume active
    return { data: { email: { status: 'active' }, sms: { status: 'active' }, push: { status: 'active' }, in_app: { status: 'active' } }, error: e };
  }
}

// Ops KPI views helpers
export async function getOpsBookingOfficeKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_booking_office_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}
export async function getOpsBoardingKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_boarding_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}
export async function getOpsDriverKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_driver_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}
export async function getOpsOperationsKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_operations_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}

export async function getOpsDepotKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_depot_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}
export async function getOpsMaintenanceKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_maintenance_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}
export async function getOpsFinanceKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_finance_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}
export async function getOpsHRKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_hr_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}
export async function getOpsAlertsKPIs(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  const { data, error } = await supabase.from('ops_alerts_kpis').select('*').eq('company_id', cid).order('day', { ascending: false }).limit(1);
  return { data: data?.[0] || null, error };
}

// Combined snapshot using ops views (fallback to existing RPC-based snapshot if needed)
export async function getOpsSnapshotFromViews(companyId) {
  const cid = getCompanyId(companyId);
  if (!cid) return { data: null, error: null };
  try {
    const [booking, boarding, driver, ops, depot, maint, fin, hr, alerts] = await Promise.all([
      getOpsBookingOfficeKPIs(cid),
      getOpsBoardingKPIs(cid),
      getOpsDriverKPIs(cid),
      getOpsOperationsKPIs(cid),
      getOpsDepotKPIs(cid),
      getOpsMaintenanceKPIs(cid),
      getOpsFinanceKPIs(cid),
      getOpsHRKPIs(cid),
      getOpsAlertsKPIs(cid)
    ]);
    const snap = {
      booking: {
        volumeToday: Number(booking.data?.bookings_today || 0),
        largeRefundsPending: Number(booking.data?.refunds_pending_today || 0),
        reconciliationStatus: booking.data?.reconciliation_status || 'OK',
        fraudAlerts: Number(booking.data?.potentially_fraud || 0),
        blacklistOverrides: Number(booking.data?.blacklist_overrides || 0),
      },
      boarding: {
        seatUtilizationPct: Number(boarding.data?.seat_utilization_pct || 0),
        incidentsToday: Number(boarding.data?.incidents || 0),
        delays: Number(boarding.data?.delays || 0),
      },
      driver: {
        completionRate: Number(driver.data?.completion_pct || 0),
        accidents: Number(driver.data?.accidents || 0),
        onTimeScore: Number(driver.data?.on_time_score || 0),
        expiredCerts: Number(driver.data?.expired_certs || 0),
      },
      ops: {
        utilizationPct: Number(ops.data?.utilization_pct || 0),
        deadMileageKm: Number(ops.data?.dead_mileage_km || 0),
        routeApprovals: Number(ops.data?.approvals_pending || 0),
      },
      depot: {
        readinessPct: Number(depot.data?.readiness_pct || 0),
        staffShortages: Number(depot.data?.staff_shortages || 0),
        busesDown: Number(depot.data?.buses_down || 0),
      },
      maintenance: {
        downtimePct: Number(maint.data?.downtime_pct || 0),
        majorApprovals: Number(maint.data?.major_approvals || 0),
        monthCost: Number(maint.data?.month_cost || 0),
      },
      finance: {
        pnlMonth: Number(fin.data?.pnl_month || 0),
        highRiskRefunds: Number(fin.data?.high_risk_refunds || 0),
        largeExpensesPending: Number(fin.data?.large_expenses_pending || 0),
      },
      hr: {
        turnoverRate: Number(hr.data?.turnover_rate || 0),
        criticalHires: Number(hr.data?.critical_hires || 0),
        payrollAdjustments: Number(hr.data?.payroll_adjustments || 0),
      },
      alerts: {
        escalationsToday: Number(alerts.data?.escalations_today || 0),
        broadcasts: Number(alerts.data?.broadcasts || 0),
        rules: Number(alerts.data?.rules || 0),
      },
    };
    return { data: snap };
  } catch (e) {
    // Fallback
    return getAdminOversightSnapshot(cid);
  }
}

// Developer: Companies
export async function getAllCompanies() {
  return supabase.from('companies').select('company_id, name, subscription_plan, created_at, is_active').order('created_at', { ascending: false });
}
export async function verifyCompany(company_id) {
  return supabase.from('companies').update({ is_active: true }).eq('company_id', company_id);
}
export async function suspendCompany(company_id) {
  return supabase.from('companies').update({ is_active: false }).eq('company_id', company_id);
}

// Developer: Users (global)
export async function getAllUsersGlobal() {
  return supabase.from('users').select('user_id, name, email, role, company_id, is_active, last_login');
}
export async function deactivateUserGlobal(user_id) {
  return supabase.from('users').update({ is_active: false }).eq('user_id', user_id);
}

// Developer: Fleet & Routes

// Developer: Bookings & Transactions
export async function getAllBookingsGlobal({ from, to } = {}) {
  let q = supabase.from('bookings').select('booking_id, trip_id, status, booking_date, amount, company_id');
  if (from) q = q.gte('booking_date', from);
  if (to) q = q.lte('booking_date', to);
  return q;
}
export async function getPaymentsGlobal({ from, to } = {}) {
  let q = supabase.from('payments').select('payment_id, booking_id, amount, status, created_at, company_id');
  if (from) q = q.gte('created_at', from);
  if (to) q = q.lte('created_at', to);
  return q;
}

// Developer: Billing & Subscriptions
// export async function getSubscriptions() { DUPLICATE REMOVED }
export async function updateSubscription(id, updates) {
  return supabase.from('subscriptions').update(updates).eq('id', id);
}
// export async function getInvoices() { DUPLICATE REMOVED }

// Developer: Monitoring & Logs (using activity_log)
export async function getActivityLogGlobal({ type } = {}) {
  let q = supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(500);
  if (type) q = q.eq('type', type);
  return q;
}

// Operations Hub: Maintenance, Fuel, Scheduling
export async function listMaintenanceLogs() {
  return supabase.from('maintenance_logs').select('*').eq('company_id', getCompanyId()).order('created_at', { ascending: false });
}
export async function upsertMaintenanceLog(row) {
  return supabase.from('maintenance_logs').upsert([{ ...row, company_id: getCompanyId() }], { onConflict: 'id' });
}
export async function upsertFuelLog(row) {
  return supabase.from('fuel_logs').upsert([{ ...row, company_id: getCompanyId() }], { onConflict: 'id' });
}
export async function listFuelLogs(companyId) {
  const cid = getCompanyId(companyId);
  return supabase
    .from('fuel_logs')
    .select('id, bus_id, date, liters, cost, station, receipt_url')
    .eq('company_id', cid)
    .order('date', { ascending: false });
}
export async function listTripSchedules() {
  return supabase.from('route_schedules').select('*');
}
export async function upsertTripSchedule(row) {
  return supabase.from('route_schedules').upsert([row], { onConflict: 'id' });
}

// Finance Center aggregations
export async function getFinanceAggregates(companyId) {
  const cid = getCompanyId(companyId);
  const [{ data: byDay }, { data: byRoute }, { data: expenses }] = await Promise.all([
    supabase.rpc('finance_revenue_by_day', { p_company_id: cid }),
    supabase.rpc('finance_revenue_by_route', { p_company_id: cid }),
    supabase.rpc('finance_expenses_by_type', { p_company_id: cid }),
  ]);
  return { data: { byDay: byDay || [], byRoute: byRoute || [], expenses: expenses || [] } };
}

// Finance actions
export async function sendInvoiceReminder(invoiceId) {
  return supabase.rpc('send_invoice_reminder', { p_invoice_id: invoiceId });
}

export async function markBillPaid(billId) {
  return supabase
    .from('bills')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', billId)
    .select('*')
    .maybeSingle();
}

// Dynamic pricing & promotions
export async function computeDynamicPrice(routeId, basePrice, at = new Date()) {
  return supabase.rpc('compute_dynamic_price', {
    p_company_id: getCompanyId(),
    p_route_id: routeId,
    p_base: basePrice,
    p_at: new Date(at).toISOString(),
  });
}

export async function applyPromo(code, amount) {
  return supabase.rpc('apply_promo', {
    p_company_id: getCompanyId(),
    p_code: code,
    p_amount: amount,
  });
}

// Lists for finance advanced modules
export async function getDynamicPricingRules() {
  return supabase
    .from('dynamic_pricing_rules')
    .select('id, route_id, rule_type, price_multiplier, starts_at, ends_at')
    .eq('company_id', getCompanyId())
    .order('starts_at', { ascending: false });
}

export async function listPromotions() {
  return supabase
    .from('promotions')
    .select('id, code, description, discount_percent, discount_amount, starts_at, ends_at, max_redemptions, redeemed_count, is_active')
    .eq('company_id', getCompanyId())
    .order('starts_at', { ascending: false });
}

export async function getLoyaltyWallets() {
  return supabase
    .from('loyalty_wallets')
    .select('id, customer_id, balance, updated_at')
    .eq('company_id', getCompanyId())
    .order('updated_at', { ascending: false });
}

export async function getLoyaltyTxns(wallet_id) {
  return supabase
    .from('loyalty_txns')
    .select('id, type, amount, meta, created_at')
    .eq('wallet_id', wallet_id)
    .order('created_at', { ascending: false });
}

export async function getSubsidies() {
  return supabase
    .from('subsidies')
    .select('id, program_name, period, claimed_amount, approved_amount, status, created_at')
    .eq('company_id', getCompanyId())
    .order('created_at', { ascending: false });
}

export async function getEsgInitiatives() {
  return supabase
    .from('esg_initiatives')
    .select('id, type, cost, incentive, co2_saved_kg, created_at')
    .eq('company_id', getCompanyId())
    .order('created_at', { ascending: false });
}

export async function getContracts() {
  return supabase
    .from('contracts')
    .select('id, name, type, start_date, end_date, expected_revenue, expected_cost, status')
    .eq('company_id', getCompanyId())
    .order('start_date', { ascending: false });
}

export async function getContractReports(contract_id) {
  return supabase
    .from('contract_reports')
    .select('id, period, revenue, cost, profit, created_at')
    .eq('company_id', getCompanyId())
    .eq('contract_id', contract_id)
    .order('created_at', { ascending: false });
}

export async function getFinanceDrilldown({ from, to } = {}) {
  let q = supabase
    .from('finance_drilldown')
    .select('company_id, branch_id, route_id, bus_id, date, amount')
    .eq('company_id', getCompanyId())
    .order('date', { ascending: false });
  if (from) q = q.gte('date', from);
  if (to) q = q.lte('date', to);
  return q;
}

// Driver Hub: Training, KPIs, Shifts
export async function listDriverTraining() {
  return supabase
    .from('driver_training')
    .select('id, driver_id, course, status, assigned_at, completed_at')
    .eq('company_id', getCompanyId())
    .order('assigned_at', { ascending: false });
}
export async function upsertDriverTraining(row) {
  const payload = { ...row, company_id: getCompanyId() };
  return supabase.from('driver_training').upsert([payload], { onConflict: 'id' });
}
export async function listDriverKPIs() {
  // Prefer a view if available; fallback to table
  const { data, error } = await supabase
    .from('driver_kpis')
    .select('driver_id, trips_completed, average_rating, on_time_percent');
  return { data: data || [], error };
}
export async function listDriverShifts() {
  return supabase
    .from('driver_shifts')
    .select('id, driver_id, route_id, start_time, end_time, status')
    .eq('company_id', getCompanyId())
    .order('start_time', { ascending: false });
}
export async function upsertDriverShift(row) {
  const payload = { ...row, company_id: getCompanyId() };
  return supabase.from('driver_shifts').upsert([payload], { onConflict: 'id' });
}

// Developer: Announcements
export async function listAnnouncementsGlobal() {
  return supabase.from('announcements').select('*').order('created_at', { ascending: false });
}
export async function sendGlobalAnnouncement(payload) {
  return createAnnouncement(payload);
}

// Developer: Support (global)
export async function listSupportTicketsGlobal({ status } = {}) {
  let q = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  return q;
}
// export async function assignSupportTicket(ticket_id, user_id) { DUPLICATE REMOVED }

// Developer helpers - subscriptions by company and plan change
export async function getSubscriptionsByCompany(company_id) {
  return supabase.from('subscriptions').select('*').eq('company_id', company_id).limit(1).maybeSingle();
}
export async function changeCompanyPlan(company_id, plan, amount) {
  const { data: sub } = await getSubscriptionsByCompany(company_id);
  if (sub?.id) {
    return updateSubscription(sub.id, { plan, amount });
  }
  // If no subscription, create a new one
  return supabase.from('subscriptions').insert([{ company_id, plan, amount, status: 'Active' }]);
}

// Developer helpers - update user role
export async function updateUserRoleGlobal(user_id, role) {
  return supabase.from('users').update({ role }).eq('user_id', user_id);
}

// Lightweight companies list for filters
// export async function getCompaniesLight() { DUPLICATE REMOVED }

// Company Admin dashboard KPIs and alerts
export async function getCompanyDashboardKPIs(companyId) {
  const cid = getCompanyId(companyId);
  try {
    const [{ data: trips }, { data: pax }, { data: revenue }, { data: incidents }] = await Promise.all([
      supabase.rpc('company_active_trips', { p_company_id: cid }),
      supabase.rpc('company_passengers_today', { p_company_id: cid }),
      supabase.rpc('company_revenue_today', { p_company_id: cid }),
      supabase.rpc('company_open_incidents', { p_company_id: cid })
    ]);
    return { data: {
      activeTrips: trips?.count || 0,
      passengersToday: pax?.count || 0,
      revenueToday: revenue?.amount || 0,
      incidentsOpen: incidents?.count || 0,
    }};
  } catch (e) {
    return { data: { activeTrips: 0, passengersToday: 0, revenueToday: 0, incidentsOpen: 0 }, error: String(e) };
  }
}

export async function getCompanyAlertsFeed(companyId) {
  const cid = getCompanyId(companyId);
  return supabase.from('activity_log').select('*').eq('company_id', cid).order('created_at', { ascending: false }).limit(200);
}
// Document Management APIs
export async function getDriverDocuments(userId, companyId) {
  const cid = getCompanyId(companyId);
  const uid = userId || window.userId;
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', uid)
    .eq('company_id', cid)
    .order('uploaded_at', { ascending: false });
  if (error) return { data: null, error };
  // Create short-lived signed URLs for each doc
  const withUrls = await Promise.all((data || []).map(async (d) => {
    try {
      const { data: signed } = await supabase.storage
        .from('documents')
        .createSignedUrl(d.file_path, 600);
      return { ...d, signed_url: signed?.signedUrl || null };
    } catch {
      return { ...d, signed_url: null };
    }
  }));
  return { data: withUrls };
}

export async function uploadDriverDocument(file, metadata = {}) {
  const cid = getCompanyId();
  const uid = window.userId;
  
  // Client-side validation: size and type
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (!allowed.includes(file.type)) throw new Error('Unsupported file type');
  if (file.size > maxSize) throw new Error('File too large');

  // Upload file to Supabase Storage
  const fileName = `${uid}/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  
  if (uploadError) throw uploadError;
  
  // Obtain a short-lived signed URL for immediate private access
  let signedUrl = null;
  try {
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileName, 3600);
    signedUrl = signed?.signedUrl || null;
  } catch {}

  // Save document record
  const documentData = {
    title: metadata.title || file.name,
    type: metadata.type || 'general',
    description: metadata.description || '',
    file_path: fileName,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    expiry_date: metadata.expiryDate || null,
    status: 'Active',
    user_id: uid,
    company_id: cid,
    uploaded_at: new Date().toISOString(),
    uploaded_by: uid,
    signed_url: signedUrl
  };
  
  return supabase.from('documents').insert([documentData]);
}

export async function deleteDocument(documentId) {
  return supabase.from('documents').delete().eq('document_id', documentId);
}

// Communication APIs
export async function getMessages(userId, companyId) {
  const cid = getCompanyId(companyId);
  const uid = userId || window.userId;
  return supabase
    .from('messages')
    .select('*, from_user:from_user_id(*), to_user:to_user_id(*)')
    .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
    .eq('company_id', cid)
    .order('created_at', { ascending: false });
}

export async function sendMessage(messageData) {
  const cid = getCompanyId();
  const uid = window.userId;
  
  const message = {
    subject: messageData.subject,
    content: messageData.content,
    type: messageData.type || 'General',
    from_user_id: uid,
    to_user_id: messageData.toUserId || null,
    company_id: cid,
    priority: messageData.priority || 'Normal',
    created_at: new Date().toISOString(),
    is_read: false
  };
  
  return supabase.from('messages').insert([message]);
}

export async function markMessageAsRead(messageId) {
  return supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('message_id', messageId);
}

export async function getCompanyAnnouncements(companyId) {
  const cid = getCompanyId(companyId);
  return supabase
    .from('announcements')
    .select('*')
    .eq('company_id', cid)
    .eq('is_active', true)
    .gte('expiry_date', new Date().toISOString())
    .order('created_at', { ascending: false });
}

export async function createCompanyAnnouncement(announcementData) {
  const cid = getCompanyId();
  const uid = window.userId;
  
  const announcement = {
    title: announcementData.title,
    content: announcementData.content,
    type: announcementData.type || 'General',
    company_id: cid,
    priority: announcementData.priority || 'Normal',
    created_at: new Date().toISOString(),
    created_by: uid,
    is_active: true,
    expiry_date: announcementData.expiryDate || null
  };
  
  return supabase.from('announcements').insert([announcement]);
}

// Incident Management APIs
export async function getIncidents(companyId, status, severity) {
  const cid = getCompanyId(companyId);
  let query = supabase
    .from('incidents')
    .select('*, reported_by_user:reported_by_user_id(*), assigned_to_user:assigned_to_user_id(*)')
    .eq('company_id', cid)
    .order('reported_at', { ascending: false });
  
  if (status) query = query.eq('status', status);
  if (severity) query = query.eq('severity', severity);
  
  return query;
}

export async function createIncident(incidentData) {
  const cid = getCompanyId();
  const uid = window.userId;
  
  const incident = {
    title: incidentData.title,
    description: incidentData.description,
    type: incidentData.type || 'General',
    severity: incidentData.severity || 'Medium',
    status: 'Open',
    location: incidentData.location || null,
    incident_date: incidentData.incidentDate || new Date().toISOString(),
    reported_at: new Date().toISOString(),
    reported_by_user_id: uid,
    company_id: cid,
    trip_id: incidentData.tripId || null,
    bus_id: incidentData.busId || null
  };
  
  return supabase.from('incidents').insert([incident]);
}

export async function updateIncident(incidentId, updates) {
  return supabase
    .from('incidents')
    .update(updates)
    .eq('incident_id', incidentId);
}

export async function assignIncident(incidentId, assignedToUserId) {
  return supabase
    .from('incidents')
    .update({ 
      assigned_to_user_id: assignedToUserId, 
      status: 'Assigned' 
    })
    .eq('incident_id', incidentId);
}

export async function resolveIncident(incidentId, resolution) {
  return supabase
    .from('incidents')
    .update({ 
      status: 'Resolved', 
      resolution: resolution,
      resolved_at: new Date().toISOString()
    })
    .eq('incident_id', incidentId);
}

// Occupancy and Boarding progress
export async function getTripOccupancy(trip_id) {
  try {
    const { data, error } = await supabase
      .from('trip_occupancy')
      .select('seats_sold, capacity')
      .eq('trip_id', trip_id)
      .single();
    if (error) throw error;
    return { data: { booked: data?.seats_sold || 0, capacity: data?.capacity || 0 } };
  } catch {
    return { data: { booked: 0, capacity: 0 } };
  }
}

export async function getBoardingProgress(trip_id) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_id, status')
      .eq('trip_id', trip_id);
    if (error) throw error;
    const total = (data||[]).length;
    const boarded = (data||[]).filter(b => (b.status||'').toLowerCase() === 'boarded').length;
    return { data: { boarded, total } };
  } catch {
    return { data: { boarded: 0, total: 0 } };
  }
}

// Passenger controls
export async function markPassengerLate(booking_id) {
  return supabase.from('bookings').update({ status: 'Late Arrival' }).eq('booking_id', booking_id);
}

// Driver logs and incidents
export async function clockIn() {
  try {
    const assign = await getCurrentDriverAssignment();
    if (assign?.data?.driver_id) {
      await supabase.from('drivers').update({ status: 'on_duty', updated_at: new Date().toISOString() }).eq('driver_id', assign.data.driver_id);
    }
  } catch {}
  return supabase.from('activity_log').insert([{ company_id: window.companyId, type: 'driver_clock_in', message: window.userId }]);
}
export async function clockOut() {
  try {
    const assign = await getCurrentDriverAssignment();
    if (assign?.data?.driver_id) {
      await supabase.from('drivers').update({ status: 'off_duty', updated_at: new Date().toISOString() }).eq('driver_id', assign.data.driver_id);
    }
  } catch {}
  return supabase.from('activity_log').insert([{ company_id: window.companyId, type: 'driver_clock_out', message: window.userId }]);
}
export async function submitMaintenanceChecklist(checklist) {
  const payload = { company_id: window.companyId, type: 'maintenance_check', message: JSON.stringify(checklist) };
  return supabase.from('activity_log').insert([payload]);
}
export async function reportDriverIncident(description, severity) {
  return supabase.from('incidents').insert([{ company_id: window.companyId, driver_id: null, bus_id: null, description, severity }]);
}

// Driver profile and documents
export async function getDriverProfile() {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('name, license_number, assigned_bus_id')
      .eq('company_id', window.companyId)
      .ilike('name', (window.user?.name || '%'))
      .maybeSingle();
    if (error) throw error;
    return { data };
  } catch {
    return { data: {} };
  }
}



// GPS updates (basic)
export async function postGPSLocation(lat, lng) {
  const payload = { company_id: window.companyId, type: 'driver_gps', message: JSON.stringify({ lat, lng }) };
  return supabase.from('activity_log').insert([payload]);
}

export async function logSpeedAlert(kmh, lat, lng) {
  const payload = { company_id: window.companyId, type: 'speed_alert', message: JSON.stringify({ kmh, lat, lng }) };
  return supabase.from('activity_log').insert([payload]);
}

// Route coordinates (for map navigation)
export async function getRouteCoordinates(route_id) {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('origin, destination, stops')
      .eq('route_id', route_id)
      .maybeSingle();
    if (error) throw error;
    let originCoords = null;
    let destinationCoords = null;
    const stops = data?.stops;
    if (stops) {
      if (Array.isArray(stops)) {
        const findByRole = (roles) => stops.find(s => roles.includes(String(s.role || s.type || '').toLowerCase()));
        const o = findByRole(['origin','start','depot','station']);
        const d = findByRole(['destination','end','terminal','station']);
        if (o && o.lat && o.lng) originCoords = { lat: o.lat, lng: o.lng };
        if (d && d.lat && d.lng) destinationCoords = { lat: d.lat, lng: d.lng };
      } else if (typeof stops === 'object') {
        const o = stops.origin || stops.start || stops.depot;
        const d = stops.destination || stops.end || stops.terminal;
        if (o && o.lat && o.lng) originCoords = { lat: o.lat, lng: o.lng };
        if (d && d.lat && d.lng) destinationCoords = { lat: d.lat, lng: d.lng };
      }
    }
    return { data: { originCoords, destinationCoords, origin: data?.origin, destination: data?.destination } };
  } catch {
    return { data: { originCoords: null, destinationCoords: null } };
  }
}

export async function getRouteStops(route_id) {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('stops')
      .eq('route_id', route_id)
      .single();
    if (error) throw error;
    const raw = data?.stops;
    const normalized = [];
    if (Array.isArray(raw)) {
      raw.forEach((s, idx) => normalized.push({
        name: s.name || s.label || s.city || `Stop ${idx+1}`,
        lat: s.lat || s.latitude || null,
        lng: s.lng || s.longitude || null,
        role: String(s.role || s.type || 'stop').toLowerCase(),
        index: idx,
      }));
    } else if (raw && typeof raw === 'object') {
      const pushIf = (obj, role) => { if (obj) normalized.push({ name: obj.name || role, lat: obj.lat || null, lng: obj.lng || null, role, index: normalized.length }); };
      pushIf(raw.origin || raw.start || raw.depot, 'origin');
      (Array.isArray(raw.checkpoints) ? raw.checkpoints : []).forEach((s, idx) => normalized.push({ name: s.name || `Stop ${idx+1}`, lat: s.lat || null, lng: s.lng || null, role: 'checkpoint', index: normalized.length }));
      pushIf(raw.destination || raw.end || raw.terminal, 'destination');
    }
    return { data: normalized };
  } catch {
    return { data: [] };
  }
}

export async function markCheckpointReached(trip_id, stop_index) {
  try {
    await supabase.from('trip_progress').insert([{ company_id: window.companyId, driver_id: window.userId, trip_id, stop_index }]);
  } catch {}
}

// Trip workflow
export async function getDriverTripsToday() {
  const driver_id = window.userId;
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);
  const { data, error } = await supabase
    .from('trips_with_details')
    .select('trip_id, route_name, departure_time, status')
    .eq('driver_id', driver_id)
    .gte('departure_time', start.toISOString())
    .lte('departure_time', end.toISOString())
    .order('departure_time', { ascending: true });
  return { data: data || [], error };
}

export async function computeDriverEarningsEstimate({ from, to } = {}) {
  const driver_id = window.userId;
  const start = from ? new Date(from) : new Date(Date.now() - 7*24*3600*1000);
  const end = to ? new Date(to) : new Date();
  const { data } = await supabase
    .from('trips_with_details')
    .select('trip_id, status')
    .eq('driver_id', driver_id)
    .gte('departure_time', start.toISOString())
    .lte('departure_time', end.toISOString());
  const completed = (data||[]).filter(t => String(t.status||'').toLowerCase() === 'completed').length;
  const basePerTrip = 5;
  const est = completed * basePerTrip;
  return { data: { completedTrips: completed, estimate: est, period: { from: start.toISOString(), to: end.toISOString() } } };
}

export async function listDriverTripsInRange({ from, to }) {
  const driver_id = window.userId;
  const start = from ? new Date(from) : new Date(Date.now() - 7*24*3600*1000);
  const end = to ? new Date(to) : new Date();
  const { data, error } = await supabase
    .from('trips_with_details')
    .select('trip_id, route_name, departure_time, arrival_time, status, distance_km, route_id')
    .eq('driver_id', driver_id)
    .gte('departure_time', start.toISOString())
    .lte('departure_time', end.toISOString())
    .order('departure_time', { ascending: true });
  return { data: data || [], error };
}
export async function startTrip(trip_id) {
  const status = 'Departed';
  const res = await supabase.from('trips').update({ status }).eq('trip_id', trip_id);
  try {
    await supabase.from('activity_log').insert([
      { company_id: window.companyId, type: 'trip_start', message: JSON.stringify({ trip_id }) },
      { company_id: window.companyId, type: 'trip_status', message: JSON.stringify({ trip_id, status }) },
    ]);
  } catch {}
  return res;
}

export async function endTrip(trip_id) {
  const status = 'Arrived';
  const res = await supabase.from('trips').update({ status }).eq('trip_id', trip_id);
  try {
    await supabase.from('activity_log').insert([
      { company_id: window.companyId, type: 'trip_end', message: JSON.stringify({ trip_id }) },
      { company_id: window.companyId, type: 'manifest_close', message: JSON.stringify({ trip_id }) },
      { company_id: window.companyId, type: 'trip_status', message: JSON.stringify({ trip_id, status }) },
    ]);
  } catch {}
  return res;
}

export async function markPassengerNoShow(booking_id) {
  const res = await supabase.from('bookings').update({ status: 'No Show' }).eq('booking_id', booking_id);
  try {
    await supabase.from('activity_log').insert([{ company_id: window.companyId, type: 'passenger_no_show', message: JSON.stringify({ booking_id }) }]);
  } catch {}
  return res;
}

export async function raiseIncident(kind, notes) {
  const description = notes || kind;
  const severity = kind === 'Accident' ? 'high' : (kind === 'Mechanical Failure' ? 'medium' : 'medium');
  await reportDriverIncident(description, severity);
  try {
    await supabase.from('activity_log').insert([{ company_id: window.companyId, type: 'incident_alert', message: JSON.stringify({ kind, description, severity }) }]);
  } catch {}
}

// Pre-trip inspection
export async function submitPreTripInspection(trip_id, items, passed) {
  try {
    const { data, error } = await supabase.rpc('record_inspection', { p_company_id: window.companyId, p_driver_id: window.userId, p_trip_id: trip_id, p_items: items, p_passed: !!passed });
    if (error) throw error;
    return { data };
  } catch (e) {
    return supabase.from('driver_inspections').insert([{ company_id: window.companyId, driver_id: window.userId, trip_id, items, passed: !!passed }]);
  }
}

// Ticket scanning & boarding
export async function findBookingByCode(ticket_code) {
  return supabase.from('bookings').select('booking_id, trip_id, passenger_name, seat_number, payment_status, status').eq('ticket_code', ticket_code).single();
}
export async function markBoarded(booking_id) {
  return supabase.from('bookings').update({ status: 'Boarded', boarded_at: new Date().toISOString() }).eq('booking_id', booking_id);
}

export async function processTicketScan(ticket_code, trip_id) {
  const res = await findBookingByCode(ticket_code);
  const b = res?.data;
  if (b && (!trip_id || b.trip_id === trip_id)) {
    await markBoarded(b.booking_id);
    return { success: true, booking: b };
  }
  throw new Error('Ticket not found for this trip');
}

// Company contact for calling Ops
export async function getCompanyContact() {
  try {
    const { data, error } = await supabase.from('company_settings').select('contact').eq('company_id', window.companyId).single();
    if (error) throw error;
    return { data: data?.contact || '' };
  } catch {
    return { data: '' };
  }
}

export async function getCompanySpeedLimit() {
  try {
    const { data } = await supabase.from('company_settings').select('speed_limit_kmh').eq('company_id', window.companyId).maybeSingle();
    return { data: Number(data?.speed_limit_kmh) || 100 };
  } catch {
    return { data: 100 };
  }
}

export async function getBusesByIds(busIds) {
  try {
    const ids = Array.from(new Set((busIds || []).filter(Boolean)));
    if (!ids.length) return { data: [] };
    // First try with model column
    let { data, error } = await supabase
      .from('buses')
      .select('bus_id, license_plate, model, capacity')
      .in('bus_id', ids);
    if (error) {
      // Retry without model to tolerate schema cache mismatches
      const retry = await supabase
        .from('buses')
        .select('bus_id, license_plate, capacity')
        .in('bus_id', ids);
      return { data: retry.data || [], error: retry.error };
    }
    return { data: data || [] };
  } catch {
    return { data: [] };
  }
}

// Driver history and performance
export async function getDriverTripHistory() {
  const { data: assignment } = await getCurrentDriverAssignment();
  let query = supabase
    .from('trips_with_company')
    .select('trip_id, date, departure_time, arrival_time, status, origin, destination, bus_id')
    .eq('company_id', window.companyId)
    .lt('date', new Date().toISOString().slice(0,10));
  if (assignment?.assigned_route_id) query = query.eq('route_id', assignment.assigned_route_id);
  if (assignment?.assigned_bus_id) query = query.eq('bus_id', assignment.assigned_bus_id);
  return query.order('date', { ascending: false }).order('departure_time', { ascending: false });
}

export async function getDriverPerformance() {
  const tripsRes = await getDriverTrips();
  const trips = tripsRes.data || [];
  const total = trips.length;
  const delayed = trips.filter(t => (t.status||'').toLowerCase() === 'delayed').length;
  const onTimePct = total ? Math.round(((total - delayed) / total) * 100) : 0;
  const completed = trips.filter(t => (t.status||'').toLowerCase() === 'arrived' || (t.status||'').toLowerCase() === 'completed').length;
  return { data: { onTimePct, satisfaction: null, tripsCompleted: completed, warnings: delayed } };
}

export async function getIncidentsForBus(bus_id) {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('incident_id, description, severity, status, created_at')
      .eq('company_id', window.companyId)
      .eq('bus_id', bus_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  } catch {
    return { data: [] };
  }
}

// Developer Dashboard (System-wide) - KPIs and Tables
export async function getSystemKPIs() {
  try {
    const [companiesRes, usersRes, routesRes, busesRes] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('routes').select('*', { count: 'exact', head: true }),
      supabase.from('buses').select('*', { count: 'exact', head: true }),
    ]);

    const data = {
      ActiveCompanies: companiesRes?.count || 0,
      Users: usersRes?.count || 0,
      Routes: routesRes?.count || 0,
      Buses: busesRes?.count || 0,
      CompanyPerformance: [],
      RouteMetrics: [],
      RevenueDistribution: [],
    };
    return { data };
  } catch (error) {
    return { data: { ActiveCompanies: 0, Users: 0, Routes: 0, Buses: 0, CompanyPerformance: [], RouteMetrics: [], RevenueDistribution: [] }, error };
  }
}

export async function getCompaniesTableNormalized() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('company_id, name, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) return { data: [], error };
    const normalized = (data || []).map(c => ({
      CompanyId: c.company_id,
      Name: c.name,
      IsActive: !!c.is_active,
      CreatedAt: c.created_at,
    }));
    return { data: normalized };
  } catch (error) {
    return { data: [], error };
  }
}

export async function getSystemUsersNormalized() {
  try {
    const [usersRes, companiesRes] = await Promise.all([
      supabase.from('users').select('user_id, name, email, role, company_id, is_active'),
      supabase.from('companies').select('company_id, name'),
    ]);
    if (usersRes.error) return { data: [], error: usersRes.error };
    const companyMap = new Map((companiesRes.data || []).map(c => [c.company_id, c.name]));
    const normalized = (usersRes.data || []).map(u => ({
      UserId: u.user_id,
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Company: companyMap.get(u.company_id) || String(u.company_id || ''),
      IsActive: !!u.is_active,
    }));
    return { data: normalized };
  } catch (error) {
    return { data: [], error };
  }
}

// Boarding Operator - KPIs
export async function getBoardingOperatorKPIs(companyId) {
  try {
    const resolvedCompanyId = companyId || window.companyId || null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    let query = supabase
      .from('trips')
      .select('trip_id, departure, status');
    if (resolvedCompanyId) query = query.eq('company_id', resolvedCompanyId);
    // Date filter for today (assuming UTC timestamps)
    query = query.gte('departure', startIso).lt('departure', endIso);

    const { data: trips, error } = await query;
    if (error) return { data: { tripsScheduled: 0, passengersExpected: 0, delayedTrips: 0, cancelledTrips: 0, boardingCompleted: 0, boardingStats: [], delays: [], occupancyPerTrip: [] }, error };

    const tripsScheduled = (trips || []).length;
    const delayedTrips = (trips || []).filter(t => (t.status || '').toLowerCase() === 'delayed').length;
    const cancelledTrips = (trips || []).filter(t => (t.status || '').toLowerCase() === 'cancelled').length;
    const boardingCompleted = (trips || []).filter(t => (t.status || '').toLowerCase() === 'departed').length;

    // Optional: derive passengersExpected from bookings if schema permits
    let passengersExpected = 0;
    try {
      let bookingsQuery = supabase.from('bookings').select('booking_id, trip_id');
      if (resolvedCompanyId) bookingsQuery = bookingsQuery.eq('company_id', resolvedCompanyId);
      bookingsQuery = bookingsQuery.gte('created_at', startIso).lt('created_at', endIso);
      const { data: bookings } = await bookingsQuery;
      passengersExpected = (bookings || []).length;
    } catch {}

    const data = {
      tripsScheduled,
      passengersExpected,
      delayedTrips,
      cancelledTrips,
      boardingCompleted,
      boardingStats: [],
      delays: [],
      occupancyPerTrip: [],
    };
    return { data };
  } catch (error) {
    return { data: { tripsScheduled: 0, passengersExpected: 0, delayedTrips: 0, cancelledTrips: 0, boardingCompleted: 0, boardingStats: [], delays: [], occupancyPerTrip: [] }, error };
  }
}

// Reports & Revenue
export async function getRevenueTrendByMonth() {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, created_at');
    if (error) return { data: [], error };
    const byMonth = new Map();
    (data || []).forEach(p => {
      const dt = new Date(p.created_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) || 0) + (Number(p.amount) || 0));
    });
    const trend = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, revenue]) => ({ month, revenue }));
    return { data: trend };
  } catch (error) {
    return { data: [], error };
  }
}

export async function getBookingsTrendByMonth() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_id, created_at, status');
    if (error) return { data: [], error };
    const byMonth = new Map();
    (data || []).forEach(b => {
      const dt = new Date(b.created_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const prev = byMonth.get(key) || { bookings: 0, cancellations: 0 };
      const isCancelled = (b.status || '').toLowerCase() === 'cancelled';
      byMonth.set(key, {
        bookings: prev.bookings + 1,
        cancellations: prev.cancellations + (isCancelled ? 1 : 0),
      });
    });
    const trend = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, ...v }));
    return { data: trend };
  } catch (error) {
    return { data: [], error };
  }
}

// Routes Management
export async function getAllRoutesNormalized() {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*, route_companies:route_companies(company_id)')
      .order('route_id', { ascending: true });
    if (error) return { data: [], error };
    const normalized = (data || []).map(r => ({
      route_id: r.route_id,
      origin: r.origin || r.start || r.source || '',
      destination: r.destination || r.end || r.target || '',
      stops: r.stops || null,
      company_id: r.company_id || null,
      company_count: Array.isArray(r.route_companies) ? r.route_companies.length : (r.company_id ? 1 : 0),
      occupancy: r.occupancy || null,
      revenue: r.revenue || null,
    }));
    return { data: normalized };
  } catch (error) {
    return { data: [], error };
  }
}
export async function getAllRoutesGlobal() {
  return getAllRoutesNormalized();
}

// Countries & Cities
export async function getCountries() {
  const { data, error } = await supabase.from('countries').select('id, code, name').order('name');
  if (error) return { data: [] };
  return { data };
}
export async function addCountry(code, name) {
  return supabase.from('countries').insert([{ code, name }]);
}
export async function getCities(countryId) {
  let q = supabase.from('cities').select('id, name, country_id').order('name');
  if (countryId) q = q.eq('country_id', countryId);
  const { data, error } = await q;
  if (error) return { data: [] };
  return { data };
}
export async function addCity(country_id, name) {
  return supabase.from('cities').insert([{ country_id, name }]);
}

// Buses Management
export async function getAllBusesNormalized() {
  try {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('bus_id', { ascending: true });
    if (error) return { data: [], error };
    const normalized = (data || []).map(b => ({
      bus_id: b.bus_id,
      license_plate: b.license_plate || b.license || '',
      capacity: b.capacity || 0,
      status: b.status || 'Active',
      company_id: b.company_id || null,
    }));
    return { data: normalized };
  } catch (error) {
    return { data: [], error };
  }
}
export async function getAllBusesGlobal() {
  return getAllBusesNormalized();
}

// Billing & Subscription
export async function getSubscriptions() {
  return supabase
    .from('subscriptions')
    .select('id, company_id, plan, status, current_period_end, amount')
    .order('created_at', { ascending: false });
}

export async function getInvoices() {
  return supabase
    .from('invoices')
    .select('id, company_id, amount, status, issued_at, due_at')
    .order('issued_at', { ascending: false });
}

export async function issueInvoice(company_id, amount) {
  return supabase
    .from('invoices')
    .insert([{ company_id, amount, status: 'Issued', issued_at: new Date().toISOString() }]);
}

// API Keys Management
export async function getApiKeys() {
  return supabase
    .from('api_keys')
    .select('id, company_id, key, status, created_at')
    .order('created_at', { ascending: false });
}

export async function generateApiKey(company_id) {
  const key = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return supabase
    .from('api_keys')
    .insert([{ company_id, key, status: 'Active', created_at: new Date().toISOString() }]);
}

export async function revokeApiKey(id) {
  return supabase
    .from('api_keys')
    .update({ status: 'Revoked' })
    .eq('id', id);
}

// Access Control / Security
export async function getRolesList() {
  try {
    const { data, error } = await supabase.from('roles').select('name');
    if (error) throw error;
    if (!data || data.length === 0) {
      return { data: ['developer', 'admin', 'ops_manager', 'booking_officer', 'boarding_operator', 'driver'] };
    }
    return { data: data.map(r => r.name) };
  } catch {
    return { data: ['developer', 'admin', 'ops_manager', 'booking_officer', 'boarding_operator', 'driver'] };
  }
}

export async function updateUserRole(user_id, role) {
  return supabase.from('users').update({ role }).eq('user_id', user_id);
}

export async function getRolePermissions(role) {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission')
      .eq('role', role);
    if (error) throw error;
    return { data: (data || []).map(x => x.permission) };
  } catch {
    return { data: [] };
  }
}

export async function setRolePermission(role, permission, enabled) {
  if (enabled) {
    return supabase
      .from('role_permissions')
      .upsert({ role, permission });
  }
  return supabase
    .from('role_permissions')
    .delete()
    .eq('role', role)
    .eq('permission', permission);
}

// Notifications & Support
export async function getTickets() {
  return supabase
    .from('tickets')
    .select('id, company_id, title, status, created_at, updated_at')
    .order('created_at', { ascending: false });
}

export async function resolveTicket(id) {
  return supabase
    .from('tickets')
    .update({ status: 'Resolved', updated_at: new Date().toISOString() })
    .eq('id', id);
}

// Lightweight companies list for filters
export async function getCompaniesLight() {
  const { data } = await supabase
    .from('companies')
    .select('company_id, name')
    .order('name');
  return { data: data || [] };
}

// Companies CRUD with admin assignment (Developer Dashboard)
export async function createCompanyWithAdmin(company, admin) {
  // Prefer SECURE RPC to bypass RLS if developer
  try {
    const { data, error } = await supabase.rpc('dev_create_company_with_admin', {
      p_name: company.name,
      p_is_active: company.is_active ?? true,
      p_admin_name: admin?.name || null,
      p_admin_email: admin?.email || null,
      p_admin_password: admin?.password || null,
    });
    if (!error && data) return { data: { company_id: data } };
  } catch {}
  // Fallback to direct insert (requires policy allowing developer)
  const { data: comp, error: compErr } = await supabase
    .from('companies')
    .insert([{ name: company.name, is_active: company.is_active ?? true }])
    .select('company_id')
    .single();
  if (compErr) return { error: compErr.message };
  if (admin && admin.email) {
    const userId = (crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`;
    await supabase
      .from('users')
      .insert([{ user_id: userId, name: admin.name || 'Admin', email: admin.email, role: 'admin', is_active: true, company_id: comp.company_id, password_hash: admin.password || 'Temp123!' }]);
  }
  return { data: comp };
}

export async function getRouteSchedulesByRouteId(route_id) {
  return supabase.from('route_schedules')
    .select('id, frequency, departure_time, arrival_time')
    .eq('route_id', route_id)
    .order('departure_time');
}

// ==========================
// Missing APIs referenced by UI (minimal implementations)
// ==========================

// Boarding/check-in helpers
export async function checkInBooking(booking_id) {
  // Alias to markBoarded
  return markBoarded(booking_id);
}

// Booking Office: searches and creation
export async function searchBookings(query, companyId) {
  try {
    const cid = getCompanyId(companyId);
    let q = supabase.from('bookings').select('booking_id, passenger_name, status, booking_date, amount, company_id');
    if (cid) q = q.eq('company_id', cid);
    if (query) {
      const s = String(query).toLowerCase();
      q = q.or(`booking_id.ilike.%${s}%,passenger_name.ilike.%${s}%`);
    }
    const { data, error } = await q.order('booking_date', { ascending: false }).limit(100);
    return { data: data || [], error };
  } catch (e) {
    return { data: [], error: String(e) };
  }
}

export async function createBooking(payload) {
  // Minimal insert; caller should provide required fields per schema
  return supabase.from('bookings').insert([payload]).select('*').maybeSingle();
}

// Company resources
export async function getCompanyRoutes(companyId) {
  const cid = getCompanyId(companyId);
  let q = supabase.from('routes').select('route_id, origin, destination, company_id');
  if (cid) q = q.eq('company_id', cid);
  return q.order('origin');
}

export async function getBranches(companyId) {
  const cid = getCompanyId(companyId);
  let q = supabase.from('branches').select('branch_id, name, location, company_id');
  if (cid) q = q.eq('company_id', cid);
  return q.order('name');
}

// Manifest / passengers
export async function getPassengerManifest(trip_id) {
  return supabase
    .from('bookings')
    .select('booking_id, passenger_name, seat_number, status, payment_status')
    .eq('trip_id', trip_id)
    .order('seat_number');
}

// Lost & Found
export async function listLostFound(companyId) {
  const cid = getCompanyId(companyId);
  return supabase.from('lost_found').select('*').eq('company_id', cid).order('created_at', { ascending: false });
}
export async function logLostFound(row) {
  const cid = getCompanyId();
  return supabase.from('lost_found').insert([{ ...row, company_id: cid }]).select('*').maybeSingle();
}

// Customers
export async function updateCustomerLoyalty(customer_id, delta = 0) {
  // Ensure wallet, then increment
  const cid = getCompanyId();
  await supabase.from('loyalty_wallets').upsert([{ company_id: cid, customer_id, balance: 0 }], { onConflict: 'id' });
  return supabase.rpc('increment_loyalty_balance', { p_customer_id: customer_id, p_company_id: cid, p_delta: Number(delta) })
    .catch(async () => {
      // Fallback if RPC not available
      const { data: wallet } = await supabase.from('loyalty_wallets').select('id, balance').eq('company_id', cid).eq('customer_id', customer_id).maybeSingle();
      const newBal = Number(wallet?.balance || 0) + Number(delta || 0);
      return supabase.from('loyalty_wallets').update({ balance: newBal }).eq('company_id', cid).eq('customer_id', customer_id);
    });
}
export async function blacklistCustomer(customer_id, reason = null) {
  return supabase.from('customers').update({ is_blacklisted: true, assistance_notes: reason || null }).eq('id', customer_id);
}
export async function unblacklistCustomer(customer_id) {
  return supabase.from('customers').update({ is_blacklisted: false }).eq('id', customer_id);
}

// Activity / Notifications
export async function getActivityLog(companyId) {
  const cid = getCompanyId(companyId);
  return supabase.from('activity_log').select('*').eq('company_id', cid).order('created_at', { ascending: false }).limit(500);
}
export async function getNotifications(companyId) {
  // Use announcements as notifications source for now
  const cid = getCompanyId(companyId);
  return supabase.from('announcements').select('announcement_id, title, content, type, created_at').eq('company_id', cid).order('created_at', { ascending: false });
}

// Staff / Drivers
export async function getDrivers(companyId) {
  const cid = getCompanyId(companyId);
  return supabase.from('drivers').select('driver_id, name, license_number, status, assigned_bus_id, assigned_route_id, is_active, updated_at').eq('company_id', cid);
}
export async function createDriver(row) {
  const cid = getCompanyId();
  return supabase.from('drivers').insert([{ ...row, company_id: cid }]).select('*').maybeSingle();
}
export async function updateDriver(driver_id, updates) {
  return supabase.from('drivers').update(updates).eq('driver_id', driver_id).select('*').maybeSingle();
}
export async function suspendDriver(driver_id) {
  return supabase.from('drivers').update({ is_active: false, status: 'suspended', updated_at: new Date().toISOString() }).eq('driver_id', driver_id);
}
export async function assignDriver(driver_id, { bus_id = null, route_id = null } = {}) {
  return supabase.from('drivers').update({ assigned_bus_id: bus_id, assigned_route_id: route_id, updated_at: new Date().toISOString() }).eq('driver_id', driver_id);
}

// Users (admin/developer)
export async function createUser(row) {
  return supabase.from('users').insert([row]).select('*').maybeSingle();
}
export async function updateUser(user_id, updates) {
  return supabase.from('users').update(updates).eq('user_id', user_id).select('*').maybeSingle();
}
export async function deleteUser(user_id) {
  return supabase.from('users').delete().eq('user_id', user_id);
}

// Bookings management
export async function getCompanyBookings(companyId) {
  const cid = getCompanyId(companyId);
  return supabase.from('bookings').select('*').eq('company_id', cid).order('booking_date', { ascending: false });
}
export async function updateBooking(booking_id, updates) {
  return supabase.from('bookings').update(updates).eq('booking_id', booking_id).select('*').maybeSingle();
}
export async function deleteBooking(booking_id) {
  return supabase.from('bookings').delete().eq('booking_id', booking_id);
}
export async function cancelBooking(booking_id, reason = null) {
  return supabase.from('bookings').update({ status: 'cancelled', cancellation_reason: reason }).eq('booking_id', booking_id);
}

// Buses management
export async function getCompanyBuses(companyId) {
  const cid = getCompanyId(companyId);
  return supabase.from('buses').select('*').eq('company_id', cid).order('license_plate');
}
export async function createBus(row) {
  const cid = getCompanyId();
  return supabase.from('buses').insert([{ ...row, company_id: cid }]).select('*').maybeSingle();
}
export async function updateBus(bus_id, updates) {
  return supabase.from('buses').update(updates).eq('bus_id', bus_id).select('*').maybeSingle();
}
export async function assignBusToRoute(bus_id, route_id) {
  return supabase.from('buses').update({ assigned_route_id: route_id, updated_at: new Date().toISOString() }).eq('bus_id', bus_id);
}
export async function markBusDelayed(bus_id, delay_minutes, reason = null) {
  return supabase.from('activity_log').insert([{ company_id: getCompanyId(), type: 'bus_delayed', message: JSON.stringify({ bus_id, delay_minutes, reason }) }]);
}

// Branches management
export async function createBranch(row) {
  const cid = getCompanyId();
  return supabase.from('branches').insert([{ ...row, company_id: cid }]).select('*').maybeSingle();
}
export async function setUserBranch(user_id, branch_id) {
  return supabase.from('users').update({ branch_id }).eq('user_id', user_id);
}

// Support tickets
export async function listSupportTickets(companyId) {
  const cid = getCompanyId(companyId);
  return supabase.from('support_tickets').select('*').eq('company_id', cid).order('created_at', { ascending: false });
}
export async function createSupportTicket(row) {
  const cid = getCompanyId();
  const uid = window.userId;
  return supabase.from('support_tickets').insert([{ ...row, company_id: cid, created_by: uid, status: 'open' }]).select('*').maybeSingle();
}
export async function resolveSupportTicket(ticket_id, resolution = null) {
  return supabase.from('support_tickets').update({ status: 'resolved', resolution, resolved_at: new Date().toISOString() }).eq('id', ticket_id);
}

// Trip management
export async function updateTripStatus(trip_id, status) {
  return supabase.from('trips').update({ status, updated_at: new Date().toISOString() }).eq('trip_id', trip_id);
}

// Operations Manager KPIs
export async function getOpsManagerKPIs(companyId) {
  // Alias to getOpsOperationsKPIs for compatibility
  return getOpsOperationsKPIs(companyId);
}

// Operations reports
export async function getOpsReports(companyId, { from, to } = {}) {
  const cid = getCompanyId(companyId);
  const start = from || new Date(Date.now() - 30*24*3600*1000).toISOString();
  const end = to || new Date().toISOString();
  // Return aggregated data from various sources
  try {
    const [trips, bookings, incidents] = await Promise.all([
      supabase.from('trips').select('*').eq('company_id', cid).gte('departure_time', start).lte('departure_time', end),
      supabase.from('bookings').select('*').eq('company_id', cid).gte('booking_date', start).lte('booking_date', end),
      supabase.from('incidents').select('*').eq('company_id', cid).gte('created_at', start).lte('created_at', end),
    ]);
    return {
      data: {
        trips: trips.data || [],
        bookings: bookings.data || [],
        incidents: incidents.data || [],
        period: { from: start, to: end }
      }
    };
  } catch (error) {
    return { data: { trips: [], bookings: [], incidents: [], period: { from: start, to: end } }, error };
  }
}

// Fleet status
export async function getFleetStatus(companyId) {
  const cid = getCompanyId(companyId);
  try {
    const { data, error } = await supabase
      .from('buses')
      .select('bus_id, license_plate, status, assigned_route_id')
      .eq('company_id', cid);
    if (error) throw error;
    
    const total = (data || []).length;
    const active = (data || []).filter(b => (b.status || '').toLowerCase() === 'active').length;
    const maintenance = (data || []).filter(b => (b.status || '').toLowerCase() === 'maintenance').length;
    const inactive = total - active - maintenance;
    
    return {
      data: {
        total,
        active,
        maintenance,
        inactive,
        buses: data || []
      }
    };
  } catch (error) {
    return { data: { total: 0, active: 0, maintenance: 0, inactive: 0, buses: [] }, error };
  }
}

// Routes management
export async function createRoute(row) {
  const cid = getCompanyId();
  return supabase.from('routes').insert([{ ...row, company_id: cid }]).select('*').maybeSingle();
}
export async function updateRoute(route_id, updates) {
  return supabase.from('routes').update(updates).eq('route_id', route_id).select('*').maybeSingle();
}
export async function deleteRoute(route_id) {
  return supabase.from('routes').delete().eq('route_id', route_id);
}
export async function deleteBus(bus_id) {
  return supabase.from('buses').delete().eq('bus_id', bus_id);
}
export async function getRouteStopsTable(route_id) {
  return supabase.from('route_stops').select('*').eq('route_id', route_id).order('stop_order');
}
export async function upsertRouteStopsTable(stops) {
  return supabase.from('route_stops').upsert(stops, { onConflict: 'id' }).select('*');
}
export async function assignDriverToRoute(driver_id, route_id) {
  return supabase.from('drivers').update({ assigned_route_id: route_id, updated_at: new Date().toISOString() }).eq('driver_id', driver_id);
}

// Driver inspections & trip management
export async function recordDriverInspection(inspection) {
  const cid = getCompanyId();
  const driver_id = window.userId;
  return supabase.from('driver_inspections').insert([{ ...inspection, company_id: cid, driver_id, created_at: new Date().toISOString() }]).select('*').maybeSingle();
}
export async function updateTripStatusWithReason(trip_id, status, reason = null) {
  return supabase.from('trips').update({ status, status_reason: reason, updated_at: new Date().toISOString() }).eq('trip_id', trip_id);
}
export async function getDriverTrips(driver_id, { from, to } = {}) {
  let q = supabase.from('trips').select('*').eq('driver_id', driver_id);
  if (from) q = q.gte('departure_time', from);
  if (to) q = q.lte('departure_time', to);
  return q.order('departure_time', { ascending: false });
}

// Platform metrics & support
export async function getPlatformMetrics() {
  try {
    const [companies, users, bookings] = await Promise.all([
      supabase.from('companies').select('company_id', { count: 'exact' }),
      supabase.from('users').select('user_id', { count: 'exact' }),
      supabase.from('bookings').select('booking_id, amount', { count: 'exact' }),
    ]);
    return {
      data: {
        totalCompanies: companies.count || 0,
        totalUsers: users.count || 0,
        totalBookings: bookings.count || 0,
        totalRevenue: (bookings.data || []).reduce((sum, b) => sum + (b.amount || 0), 0)
      }
    };
  } catch (error) {
    return { data: { totalCompanies: 0, totalUsers: 0, totalBookings: 0, totalRevenue: 0 }, error };
  }
}
export async function assignSupportTicket(ticket_id, assigned_to) {
  return supabase.from('support_tickets').update({ assigned_to, updated_at: new Date().toISOString() }).eq('id', ticket_id);
}

// Monitoring & System Metrics
export async function getSystemMetrics() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [companies, buses, bookings, payments] = await Promise.all([
      supabase.from('companies').select('company_id', { count: 'exact' }).eq('is_active', true),
      supabase.from('buses').select('bus_id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('bookings').select('booking_id', { count: 'exact' }).gte('booking_date', today),
      supabase.from('payments').select('amount').gte('created_at', today).eq('status', 'completed'),
    ]);
    
    const transactionsToday = (payments.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return {
      data: {
        activeCompanies: companies.count || 0,
        activeBuses: buses.count || 0,
        bookingsToday: bookings.count || 0,
        transactionsToday,
        errorsToday: 0,
        systemUptime: 99.9,
        avgResponseTime: 150,
        failedLogins: 0
      }
    };
  } catch (error) {
    return { 
      data: { 
        activeCompanies: 0, 
        activeBuses: 0, 
        bookingsToday: 0, 
        transactionsToday: 0,
        errorsToday: 0,
        systemUptime: 0,
        avgResponseTime: 0,
        failedLogins: 0
      }, 
      error 
    };
  }
}

// Announcements
export async function getAnnouncements() {
  return supabase.from('announcements').select('*').order('created_at', { ascending: false });
}
export async function createAnnouncement(announcement) {
  const user_id = window.userId || 'system';
  return supabase.from('announcements').insert([{ 
    ...announcement, 
    created_by: user_id,
    status: 'draft',
    created_at: new Date().toISOString() 
  }]).select('*').maybeSingle();
}
export async function sendAnnouncement(announcement_id) {
  return supabase.from('announcements').update({ 
    status: 'sent', 
    sent_at: new Date().toISOString() 
  }).eq('announcement_id', announcement_id);
}
export async function deleteAnnouncement(announcement_id) {
  return supabase.from('announcements').delete().eq('announcement_id', announcement_id);
}

// Platform Settings
export async function getPlatformSettings() {
  const { data, error } = await supabase.from('platform_settings').select('*');
  if (error) return { data: {}, error };
  
  // Convert array of key-value pairs to object
  const settings = {};
  (data || []).forEach(setting => {
    settings[setting.key] = setting.value;
  });
  
  return { data: settings };
}
export async function updatePlatformSettings(settings) {
  // Convert object to array of key-value pairs
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString()
  }));
  
  return supabase.from('platform_settings').upsert(updates, { onConflict: 'key' });
}
