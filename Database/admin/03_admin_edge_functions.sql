-- =====================================================
-- VTS ADMIN EDGE FUNCTIONS
-- Supabase Edge Functions for Admin API
-- =====================================================

-- =====================================================
-- ADMIN AUTHENTICATION EDGE FUNCTIONS
-- =====================================================

-- Edge function: admin-login
-- File: supabase/functions/admin-login/index.ts
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password } = await req.json()

    const { data, error } = await supabase.rpc('authenticate_admin_user', {
      p_email: email,
      p_password: password
    })

    if (error) throw error

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const adminData = data[0]
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          admin_id: adminData.admin_id,
          full_name: adminData.full_name,
          role: adminData.role,
          company_id: adminData.company_id,
          permissions: adminData.permissions,
          session_token: adminData.session_token
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
*/

-- Edge function: admin-validate-session
-- File: supabase/functions/admin-validate-session/index.ts
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const sessionToken = authHeader.substring(7)

    const { data, error } = await supabase.rpc('validate_admin_session', {
      p_session_token: sessionToken
    })

    if (error) throw error

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const adminData = data[0]
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          admin_id: adminData.admin_id,
          full_name: adminData.full_name,
          role: adminData.role,
          company_id: adminData.company_id,
          permissions: adminData.permissions
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
*/

-- =====================================================
-- COMPANY MANAGEMENT EDGE FUNCTIONS
-- =====================================================

-- Edge function: admin-dashboard-metrics
-- File: supabase/functions/admin-dashboard-metrics/index.ts
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data, error } = await supabase.rpc('get_company_dashboard_metrics', {
      p_company_id: companyId
    })

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        data: data[0] || {}
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
*/

-- =====================================================
-- BOOKING MANAGEMENT EDGE FUNCTIONS
-- =====================================================

-- Edge function: admin-bookings
-- File: supabase/functions/admin-bookings/index.ts
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'GET') {
      // Get bookings with pagination and filters
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const status = url.searchParams.get('status')
      const search = url.searchParams.get('search')
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          trip:trip_id(
            id,
            departure,
            arrival,
            route:route_id(pick_up, drop_off)
          ),
          payments(id, amount, status, payment_date)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`passenger_name.ilike.%${search}%,passenger_phone.ilike.%${search}%,passenger_email.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      // Create new booking
      const body = await req.json()
      const { trip_id, passenger_name, passenger_phone, passenger_email, seat_number, fare, booking_channel } = body

      const { data, error } = await supabase.rpc('create_booking', {
        p_company_id: companyId,
        p_trip_id: trip_id,
        p_passenger_name: passenger_name,
        p_passenger_phone: passenger_phone,
        p_passenger_email: passenger_email,
        p_seat_number: seat_number,
        p_fare: fare,
        p_booking_channel: booking_channel || 'admin'
      })

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: { booking_id: data }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
*/

-- =====================================================
-- FINANCIAL REPORTING EDGE FUNCTIONS
-- =====================================================

-- Edge function: admin-financial-reports
-- File: supabase/functions/admin-financial-reports/index.ts
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')
    const reportType = url.searchParams.get('type')
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let data, error

    switch (reportType) {
      case 'revenue_by_date':
        ({ data, error } = await supabase.rpc('get_revenue_by_date_range', {
          p_company_id: companyId,
          p_start_date: startDate,
          p_end_date: endDate
        }))
        break

      case 'revenue_by_route':
        ({ data, error } = await supabase.rpc('get_revenue_by_route', {
          p_company_id: companyId,
          p_start_date: startDate,
          p_end_date: endDate
        }))
        break

      case 'expenses_by_category':
        ({ data, error } = await supabase.rpc('get_expenses_by_category', {
          p_company_id: companyId,
          p_start_date: startDate,
          p_end_date: endDate
        }))
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        data: data || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
*/

-- =====================================================
-- AUDIT TRAIL EDGE FUNCTIONS
-- =====================================================

-- Edge function: admin-audit-logs
-- File: supabase/functions/admin-audit-logs/index.ts
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'GET') {
      // Get audit logs
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const action = url.searchParams.get('action')
      const adminUserId = url.searchParams.get('admin_user_id')
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')

      const { data, error } = await supabase.rpc('get_admin_activity_logs', {
        p_company_id: companyId,
        p_limit: limit,
        p_offset: (page - 1) * limit,
        p_admin_user_id: adminUserId,
        p_action: action,
        p_start_date: startDate,
        p_end_date: endDate
      })

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: data || []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      // Log new activity
      const body = await req.json()
      const { admin_user_id, action, resource_type, resource_id, details, ip_address, user_agent } = body

      const { data, error } = await supabase.rpc('log_admin_activity', {
        p_admin_user_id: admin_user_id,
        p_company_id: companyId,
        p_action: action,
        p_resource_type: resource_type,
        p_resource_id: resource_id,
        p_details: details,
        p_ip_address: ip_address,
        p_user_agent: user_agent
      })

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          data: { log_id: data }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
*/
