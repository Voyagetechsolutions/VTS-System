-- =========================
-- VTS System - RLS Policies (Rewrite)
-- =========================

-- Enable RLS on core tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Finance/HR/Depot
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_txns ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidies ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE depot_delay_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bays ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_kb ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_carbon ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.company_id FROM public.users u
  WHERE u.user_id = auth.uid()
     OR (lower(u.email) = lower(NULLIF(auth.jwt() ->> 'email', '')))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.role FROM public.users u
  WHERE u.user_id = auth.uid()
     OR (lower(u.email) = lower(NULLIF(auth.jwt() ->> 'email', '')))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT COALESCE(public.current_role() IN ('developer'), false); $$;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT COALESCE(public.current_role() IN ('admin','company_admin'), false); $$;
CREATE OR REPLACE FUNCTION public.is_ops()
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT COALESCE(public.current_role() IN ('ops_manager','operations_manager'), false); $$;
CREATE OR REPLACE FUNCTION public.is_booking()
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT COALESCE(public.current_role() IN ('booking_office','booking_officer'), false); $$;
CREATE OR REPLACE FUNCTION public.is_boarding()
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT COALESCE(public.current_role() IN ('boarding_operator'), false); $$;
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT COALESCE(public.current_role() IN ('driver'), false); $$;

-- Generic company-scoped policy template
-- Tables with company_id: allow developer or matching company
DO $$ BEGIN END $$;

-- Companies
DROP POLICY IF EXISTS companies_read ON companies;
CREATE POLICY companies_read ON companies FOR SELECT TO authenticated
  USING ( public.is_developer() OR company_id = public.current_company_id() );
DROP POLICY IF EXISTS companies_insert ON companies;
CREATE POLICY companies_insert ON companies FOR INSERT TO authenticated
  WITH CHECK ( public.is_developer() );
DROP POLICY IF EXISTS companies_update ON companies;
CREATE POLICY companies_update ON companies FOR UPDATE TO authenticated
  USING ( public.is_developer() OR company_id = public.current_company_id() )
  WITH CHECK ( public.is_developer() OR company_id = public.current_company_id() );
DROP POLICY IF EXISTS companies_delete ON companies;
CREATE POLICY companies_delete ON companies FOR DELETE TO authenticated
  USING ( public.is_developer() );

-- Users
DROP POLICY IF EXISTS users_select_company ON users;
CREATE POLICY users_select_company ON users FOR SELECT TO authenticated
  USING ( public.is_developer() OR company_id = public.current_company_id() );
DROP POLICY IF EXISTS users_insert ON users;
CREATE POLICY users_insert ON users FOR INSERT TO authenticated
  WITH CHECK ( public.is_developer() OR company_id = public.current_company_id() );
DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_update ON users FOR UPDATE TO authenticated
  USING ( public.is_developer() OR company_id = public.current_company_id() OR user_id = public.current_user_id() )
  WITH CHECK ( public.is_developer() OR company_id = public.current_company_id() OR user_id = public.current_user_id() );
DROP POLICY IF EXISTS users_delete ON users;
CREATE POLICY users_delete ON users FOR DELETE TO authenticated
  USING ( public.is_developer() );

-- Company Settings
DROP POLICY IF EXISTS company_settings_read ON company_settings;
CREATE POLICY company_settings_read ON company_settings FOR SELECT TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() );
DROP POLICY IF EXISTS company_settings_write ON company_settings;
CREATE POLICY company_settings_write ON company_settings FOR INSERT TO authenticated
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );
DROP POLICY IF EXISTS company_settings_update ON company_settings;
CREATE POLICY company_settings_update ON company_settings FOR UPDATE TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Buses
DROP POLICY IF EXISTS buses_rw ON buses;
CREATE POLICY buses_rw ON buses FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Routes
DROP POLICY IF EXISTS routes_rw ON routes;
CREATE POLICY routes_rw ON routes FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Route stops
DROP POLICY IF EXISTS route_stops_rw ON route_stops;
CREATE POLICY route_stops_rw ON route_stops FOR ALL TO authenticated
  USING ( EXISTS (SELECT 1 FROM routes r WHERE r.route_id = route_stops.route_id AND (r.company_id = public.current_company_id() OR public.is_developer())) )
  WITH CHECK ( EXISTS (SELECT 1 FROM routes r WHERE r.route_id = route_stops.route_id AND (r.company_id = public.current_company_id() OR public.is_developer())) );

-- Route schedules
DROP POLICY IF EXISTS route_schedules_rw ON route_schedules;
CREATE POLICY route_schedules_rw ON route_schedules FOR ALL TO authenticated
  USING ( EXISTS (SELECT 1 FROM routes r WHERE r.route_id = route_schedules.route_id AND (r.company_id = public.current_company_id() OR public.is_developer())) )
  WITH CHECK ( EXISTS (SELECT 1 FROM routes r WHERE r.route_id = route_schedules.route_id AND (r.company_id = public.current_company_id() OR public.is_developer())) );

-- Route-Companies pivot
DROP POLICY IF EXISTS route_companies_read ON route_companies;
CREATE POLICY route_companies_read ON route_companies FOR SELECT TO authenticated USING ( TRUE );
DROP POLICY IF EXISTS route_companies_write ON route_companies;
CREATE POLICY route_companies_write ON route_companies FOR ALL TO authenticated
  USING ( public.is_developer() OR company_id = public.current_company_id() )
  WITH CHECK ( public.is_developer() OR company_id = public.current_company_id() );

-- Company-Countries
DROP POLICY IF EXISTS company_countries_rw ON company_countries;
CREATE POLICY company_countries_rw ON company_countries FOR ALL TO authenticated
  USING ( public.is_developer() OR company_id = public.current_company_id() )
  WITH CHECK ( public.is_developer() OR company_id = public.current_company_id() );

-- Trips
DROP POLICY IF EXISTS trips_rw ON trips;
CREATE POLICY trips_rw ON trips FOR ALL TO authenticated
  USING ( EXISTS (SELECT 1 FROM routes ro WHERE ro.route_id = trips.route_id AND (ro.company_id = public.current_company_id() OR public.is_developer())) )
  WITH CHECK ( EXISTS (SELECT 1 FROM routes ro WHERE ro.route_id = trips.route_id AND (ro.company_id = public.current_company_id() OR public.is_developer())) );

-- Bookings
DROP POLICY IF EXISTS bookings_read ON bookings;
CREATE POLICY bookings_read ON bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips tr
      JOIN routes ro ON ro.route_id = tr.route_id
      WHERE tr.trip_id = bookings.trip_id AND (ro.company_id = public.current_company_id() OR public.is_developer())
    )
  );
DROP POLICY IF EXISTS bookings_write ON bookings;
CREATE POLICY bookings_write ON bookings FOR ALL TO authenticated
  USING (
    public.is_developer() OR public.is_booking() OR public.is_boarding() OR EXISTS (
      SELECT 1 FROM trips tr
      JOIN routes ro ON ro.route_id = tr.route_id
      WHERE tr.trip_id = bookings.trip_id AND ro.company_id = public.current_company_id()
    )
  )
  WITH CHECK (
    public.is_developer() OR public.is_booking() OR public.is_boarding() OR EXISTS (
      SELECT 1 FROM trips tr
      JOIN routes ro ON ro.route_id = tr.route_id
      WHERE tr.trip_id = bookings.trip_id AND ro.company_id = public.current_company_id()
    )
  );

-- Payments
DROP POLICY IF EXISTS payments_rw ON payments;
CREATE POLICY payments_rw ON payments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM bookings b
      JOIN trips tr ON tr.trip_id = b.trip_id
      JOIN routes ro ON ro.route_id = tr.route_id
      WHERE payments.booking_id = b.booking_id AND (ro.company_id = public.current_company_id() OR public.is_developer())
    )
  )
  WITH CHECK ( TRUE );

-- Customers
DROP POLICY IF EXISTS customers_rw ON customers;
CREATE POLICY customers_rw ON customers FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Lost & Found
DROP POLICY IF EXISTS lost_found_rw ON lost_found;
CREATE POLICY lost_found_rw ON lost_found FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Incidents
DROP POLICY IF EXISTS incidents_rw ON incidents;
CREATE POLICY incidents_rw ON incidents FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Driver Inspections
DROP POLICY IF EXISTS inspections_rw ON driver_inspections;
CREATE POLICY inspections_rw ON driver_inspections FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Activity Log
DROP POLICY IF EXISTS activity_log_rw ON activity_log;
CREATE POLICY activity_log_rw ON activity_log FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Tickets & Announcements
DROP POLICY IF EXISTS tickets_rw ON tickets;
CREATE POLICY tickets_rw ON tickets FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

DROP POLICY IF EXISTS announcements_read ON announcements;
CREATE POLICY announcements_read ON announcements FOR SELECT TO authenticated USING ( TRUE );
DROP POLICY IF EXISTS announcements_write ON announcements;
CREATE POLICY announcements_write ON announcements FOR ALL TO authenticated
  USING ( public.is_developer() OR public.is_admin() )
  WITH CHECK ( public.is_developer() OR public.is_admin() );

-- Subscriptions & Invoices
DROP POLICY IF EXISTS subscriptions_rw ON subscriptions;
CREATE POLICY subscriptions_rw ON subscriptions FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

DROP POLICY IF EXISTS invoices_rw ON invoices;
CREATE POLICY invoices_rw ON invoices FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Countries & Cities (read for all authenticated; write only developer)
DROP POLICY IF EXISTS countries_read ON countries;
CREATE POLICY countries_read ON countries FOR SELECT TO authenticated USING ( TRUE );
DROP POLICY IF EXISTS countries_write ON countries;
CREATE POLICY countries_write ON countries FOR ALL TO authenticated
  USING ( public.is_developer() ) WITH CHECK ( public.is_developer() );

DROP POLICY IF EXISTS cities_read ON cities;
CREATE POLICY cities_read ON cities FOR SELECT TO authenticated USING ( TRUE );
DROP POLICY IF EXISTS cities_write ON cities;
CREATE POLICY cities_write ON cities FOR ALL TO authenticated
  USING ( public.is_developer() ) WITH CHECK ( public.is_developer() );

-- Trip progress
DROP POLICY IF EXISTS trip_progress_rw ON trip_progress;
CREATE POLICY trip_progress_rw ON trip_progress FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

-- Documents
DROP POLICY IF EXISTS documents_rw ON documents;
CREATE POLICY documents_rw ON documents FOR ALL TO authenticated
  USING (
    user_id = auth.uid() OR
    (public.is_admin() AND company_id = public.current_company_id()) OR
    public.is_developer()
  )
  WITH CHECK (
    user_id = auth.uid() OR
    (public.is_admin() AND company_id = public.current_company_id()) OR
    public.is_developer()
  );

-- Storage: lock bucket policies via PostgREST accessible table proxies (if using storage API policies in SQL)
-- Note: Bucket-level access configured in Supabase Storage UI. Ensure 'documents' bucket is private.

-- Global Communications
DROP POLICY IF EXISTS global_messages_select ON global_messages;
CREATE POLICY global_messages_select ON global_messages FOR SELECT TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() );
DROP POLICY IF EXISTS global_messages_insert ON global_messages;
CREATE POLICY global_messages_insert ON global_messages FOR INSERT TO authenticated
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

DROP POLICY IF EXISTS notification_policies_select ON notification_policies;
CREATE POLICY notification_policies_select ON notification_policies FOR SELECT TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() );
DROP POLICY IF EXISTS notification_policies_write ON notification_policies;
CREATE POLICY notification_policies_write ON notification_policies FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );

DROP POLICY IF EXISTS message_templates_select ON message_templates;
CREATE POLICY message_templates_select ON message_templates FOR SELECT TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() );
DROP POLICY IF EXISTS message_templates_write ON message_templates;
CREATE POLICY message_templates_write ON message_templates FOR ALL TO authenticated
  USING ( company_id = public.current_company_id() OR public.is_developer() )
  WITH CHECK ( company_id = public.current_company_id() OR public.is_developer() );
