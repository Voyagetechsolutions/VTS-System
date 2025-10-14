// =====================================================
// VTS ADMIN API INTEGRATION
// Frontend integration for admin dashboard
// =====================================================

import { supabase } from '../../../Frontend/src/supabase/client';

// =====================================================
// ADMIN AUTHENTICATION API
// =====================================================

export const adminAuth = {
  // Login admin user
  async login(email, password) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { email, password }
      });

      if (error) throw error;

      if (data.success) {
        // Store session token
        localStorage.setItem('admin_session_token', data.data.session_token);
        localStorage.setItem('admin_user', JSON.stringify(data.data));
        return data.data;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  // Validate current session
  async validateSession() {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) {
        throw new Error('No session token found');
      }

      const { data, error } = await supabase.functions.invoke('admin-validate-session', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (error) throw error;

      if (data.success) {
        localStorage.setItem('admin_user', JSON.stringify(data.data));
        return data.data;
      } else {
        throw new Error(data.error || 'Session validation failed');
      }
    } catch (error) {
      console.error('Session validation error:', error);
      this.logout();
      throw error;
    }
  },

  // Logout admin user
  logout() {
    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('companyId');
  },

  // Get current admin user
  getCurrentUser() {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('admin_session_token');
  }
};

// =====================================================
// COMPANY MANAGEMENT API
// =====================================================

export const companyAPI = {
  // Get dashboard metrics
  async getDashboardMetrics(companyId) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-dashboard-metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_session_token')}`
        },
        body: { company_id: companyId }
      });

      if (error) throw error;
      return data.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  // Get company details
  async getCompanyDetails(companyId) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching company details:', error);
      throw error;
    }
  },

  // Update company details
  async updateCompany(companyId, updates) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }
};

// =====================================================
// BOOKING MANAGEMENT API
// =====================================================

export const bookingAPI = {
  // Get bookings with pagination and filters
  async getBookings(companyId, options = {}) {
    try {
      const params = new URLSearchParams({
        company_id: companyId,
        page: options.page || 1,
        limit: options.limit || 50,
        ...(options.status && { status: options.status }),
        ...(options.search && { search: options.search })
      });

      const { data, error } = await supabase.functions.invoke('admin-bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_session_token')}`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Create new booking
  async createBooking(companyId, bookingData) {
    try {
      const { data, error } = await supabase.rpc('create_booking', {
        p_company_id: companyId,
        p_trip_id: bookingData.trip_id,
        p_passenger_name: bookingData.passenger_name,
        p_passenger_phone: bookingData.passenger_phone,
        p_passenger_email: bookingData.passenger_email,
        p_seat_number: bookingData.seat_number,
        p_fare: bookingData.fare,
        p_booking_channel: bookingData.booking_channel || 'admin'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Cancel booking
  async cancelBooking(bookingId, companyId) {
    try {
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: bookingId,
        p_company_id: companyId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Update booking
  async updateBooking(bookingId, updates) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }
};

// =====================================================
// FINANCIAL REPORTING API
// =====================================================

export const financialAPI = {
  // Get revenue by date range
  async getRevenueByDateRange(companyId, startDate, endDate) {
    try {
      const { data, error } = await supabase.rpc('get_revenue_by_date_range', {
        p_company_id: companyId,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching revenue by date:', error);
      throw error;
    }
  },

  // Get revenue by route
  async getRevenueByRoute(companyId, startDate = null, endDate = null) {
    try {
      const { data, error } = await supabase.rpc('get_revenue_by_route', {
        p_company_id: companyId,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching revenue by route:', error);
      throw error;
    }
  },

  // Get expenses by category
  async getExpensesByCategory(companyId, startDate = null, endDate = null) {
    try {
      const { data, error } = await supabase.rpc('get_expenses_by_category', {
        p_company_id: companyId,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      throw error;
    }
  },

  // Get payments
  async getPayments(companyId, options = {}) {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          booking:booking_id(
            id,
            passenger_name,
            passenger_phone,
            trip:trip_id(
              id,
              route:route_id(pick_up, drop_off)
            )
          )
        `)
        .eq('company_id', companyId)
        .order('payment_date', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Get expenses
  async getExpenses(companyId, options = {}) {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:category_id(name)
        `)
        .eq('company_id', companyId)
        .order('expense_date', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }
};

// =====================================================
// FLEET MANAGEMENT API
// =====================================================

export const fleetAPI = {
  // Get buses
  async getBuses(companyId, options = {}) {
    try {
      let query = supabase
        .from('buses')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching buses:', error);
      throw error;
    }
  },

  // Get drivers (staff with driver role)
  async getDrivers(companyId, options = {}) {
    try {
      let query = supabase
        .from('staff')
        .select('*')
        .eq('company_id', companyId)
        .eq('role', 'Driver')
        .order('name');

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  // Get trips
  async getTrips(companyId, options = {}) {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          route:route_id(pick_up, drop_off),
          bus:bus_id(name, license_plate),
          driver:driver_id(name)
        `)
        .eq('company_id', companyId)
        .order('departure', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.date) {
        const startOfDay = new Date(options.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(options.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte('departure', startOfDay.toISOString())
          .lte('departure', endOfDay.toISOString());
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  }
};

// =====================================================
// STAFF MANAGEMENT API
// =====================================================

export const staffAPI = {
  // Get staff
  async getStaff(companyId, options = {}) {
    try {
      let query = supabase
        .from('staff')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (options.role) {
        query = query.eq('role', options.role);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },

  // Get staff shifts
  async getStaffShifts(companyId, date = null) {
    try {
      let query = supabase
        .from('staff_shifts')
        .select(`
          *,
          staff:staff_id(name, role)
        `)
        .eq('company_id', companyId)
        .order('shift_date', { ascending: false });

      if (date) {
        query = query.eq('shift_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching staff shifts:', error);
      throw error;
    }
  }
};

// =====================================================
// AUDIT TRAIL API
// =====================================================

export const auditAPI = {
  // Get audit logs
  async getAuditLogs(companyId, options = {}) {
    try {
      const { data, error } = await supabase.rpc('get_admin_activity_logs', {
        p_company_id: companyId,
        p_limit: options.limit || 100,
        p_offset: options.offset || 0,
        p_admin_user_id: options.adminUserId || null,
        p_action: options.action || null,
        p_start_date: options.startDate || null,
        p_end_date: options.endDate || null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  // Log admin activity
  async logActivity(companyId, activityData) {
    try {
      const { data, error } = await supabase.rpc('log_admin_activity', {
        p_admin_user_id: activityData.admin_user_id,
        p_company_id: companyId,
        p_action: activityData.action,
        p_resource_type: activityData.resource_type,
        p_resource_id: activityData.resource_id,
        p_details: activityData.details || {},
        p_ip_address: activityData.ip_address || null,
        p_user_agent: activityData.user_agent || null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const adminUtils = {
  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleDateString();
  },

  // Format datetime
  formatDateTime(datetime) {
    return new Date(datetime).toLocaleString();
  },

  // Get date range for common periods
  getDateRange(period) {
    const now = new Date();
    const ranges = {
      today: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      },
      yesterday: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      },
      thisWeek: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7)
      },
      thisMonth: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      },
      lastMonth: {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    };

    return ranges[period] || ranges.today;
  }
};
