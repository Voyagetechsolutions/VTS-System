-- =====================================
-- VTS System - Supabase Schema (Rewrite)
-- =====================================
-- Ordering respects FK dependencies. No JSON/JSONB columns per user preference.
-- Use TEXT columns where free-form structures were previously JSON.

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Core
-- =========================
CREATE TABLE IF NOT EXISTS companies (
  company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subscription_plan TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
  branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(branch_id),
  role TEXT,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

-- Employee extended profile (flattened TEXT fields)
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  full_name TEXT,
  id_passport TEXT,
  address TEXT,
  phone TEXT,
  emergency_contact TEXT,
  employer TEXT,
  job_details TEXT,
  compensation_details TEXT,
  leave_entitlements TEXT,
  contract_details TEXT,
  other_terms TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);

-- Geography
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alt_names TEXT
);

CREATE TABLE IF NOT EXISTS company_countries (
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, country_id)
);

-- =========================
-- Fleet and Routes
-- =========================
CREATE TABLE IF NOT EXISTS buses (
  bus_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  license_plate TEXT,
  model TEXT,
  capacity INT,
  status TEXT,
  config TEXT,
  insurance TEXT,
  name TEXT,
  type TEXT,
  feature_wifi BOOLEAN DEFAULT FALSE,
  feature_ac BOOLEAN DEFAULT FALSE,
  feature_charging BOOLEAN DEFAULT FALSE,
  feature_recliner BOOLEAN DEFAULT FALSE,
  feature_toilet BOOLEAN DEFAULT FALSE,
  mileage NUMERIC,
  last_service_at TIMESTAMP,
  status_rank INT,
  current_driver_id UUID,
  assigned_route_id UUID,
  created_at TIMESTAMP DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buses' AND column_name = 'status_rank'
  ) THEN
    ALTER TABLE buses ADD COLUMN status_rank INT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buses' AND column_name = 'current_driver_id'
  ) THEN
    ALTER TABLE buses ADD COLUMN current_driver_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buses' AND column_name = 'assigned_route_id'
  ) THEN
    ALTER TABLE buses ADD COLUMN assigned_route_id UUID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS routes (
  route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  origin TEXT,
  destination TEXT,
  country TEXT,
  duration INTERVAL,
  price NUMERIC,
  route_code TEXT,
  status TEXT,
  distance_km NUMERIC,
  estimated_travel_time INTERVAL,
  road_type TEXT,
  currency TEXT,
  permit_number TEXT,
  discount_amount NUMERIC,
  discount_percent NUMERIC,
  pickup_city_id UUID REFERENCES cities(id),
  dropoff_city_id UUID REFERENCES cities(id),
  start_latitude NUMERIC,
  start_longitude NUMERIC,
  end_latitude NUMERIC,
  end_longitude NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'start_latitude'
  ) THEN
    ALTER TABLE routes ADD COLUMN start_latitude NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'start_longitude'
  ) THEN
    ALTER TABLE routes ADD COLUMN start_longitude NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'end_latitude'
  ) THEN
    ALTER TABLE routes ADD COLUMN end_latitude NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'end_longitude'
  ) THEN
    ALTER TABLE routes ADD COLUMN end_longitude NUMERIC;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(route_id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  name TEXT NOT NULL,
  city_id UUID REFERENCES cities(id),
  eta TIME,
  etd TIME
);

CREATE TABLE IF NOT EXISTS route_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(route_id) ON DELETE CASCADE,
  frequency TEXT,
  departure_time TIME,
  arrival_time TIME
);

CREATE TABLE IF NOT EXISTS bus_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(bus_id),
  route_id UUID REFERENCES routes(route_id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(bus_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  speed_kph NUMERIC,
  heading NUMERIC,
  location_label TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_time ON bus_locations(bus_id, recorded_at DESC);

CREATE OR REPLACE VIEW bus_latest_locations AS
SELECT DISTINCT ON (bl.bus_id)
  bl.bus_id,
  bl.company_id,
  bl.latitude,
  bl.longitude,
  bl.speed_kph,
  bl.heading,
  bl.location_label,
  bl.recorded_at
FROM bus_locations bl
ORDER BY bl.bus_id, bl.recorded_at DESC;

CREATE TABLE IF NOT EXISTS route_companies (
  route_id UUID REFERENCES routes(route_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  PRIMARY KEY (route_id, company_id)
);

CREATE TABLE IF NOT EXISTS drivers (
  driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT,
  license_number TEXT,
  status TEXT DEFAULT 'available',
  assigned_bus_id UUID REFERENCES buses(bus_id),
  assigned_route_id UUID REFERENCES routes(route_id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);

CREATE OR REPLACE FUNCTION admin_live_map_fleet(p_company_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH latest AS (
  SELECT bl.bus_id, bl.latitude, bl.longitude, bl.location_label, bl.recorded_at, bl.speed_kph, bl.heading
  FROM bus_latest_locations bl
  WHERE bl.company_id = p_company_id
),
fleet AS (
  SELECT
    b.license_plate,
    jsonb_build_object(
      'bus_id', b.bus_id,
      'license_plate', b.license_plate,
      'status', b.status,
      'status_rank', b.status_rank,
      'status_text', CASE b.status_rank WHEN 1 THEN 'FIT' WHEN 2 THEN 'OK' WHEN 3 THEN 'UNWELL' ELSE NULL END,
      'route_id', b.assigned_route_id,
      'route_name', CASE WHEN r.origin IS NOT NULL OR r.destination IS NOT NULL THEN concat_ws(' \u2192 ', r.origin, r.destination) ELSE NULL END,
      'route_origin', r.origin,
      'route_destination', r.destination,
      'driver_id', COALESCE(d_direct.driver_id, d_assigned.driver_id),
      'driver_name', COALESCE(d_direct.name, d_assigned.name),
      'latitude', l.latitude,
      'longitude', l.longitude,
      'location_label', l.location_label,
      'last_update', l.recorded_at,
      'speed_kph', l.speed_kph,
      'heading', l.heading
    ) AS bus
  FROM buses b
  LEFT JOIN latest l ON l.bus_id = b.bus_id
  LEFT JOIN drivers d_direct ON d_direct.driver_id = b.current_driver_id
  LEFT JOIN drivers d_assigned ON d_assigned.assigned_bus_id = b.bus_id AND d_assigned.company_id = b.company_id
  WHERE b.company_id = p_company_id
)
SELECT jsonb_build_object(
  'buses', COALESCE(jsonb_agg(fleet.bus ORDER BY fleet.license_plate), '[]'::jsonb)
)
FROM fleet;
$$;

CREATE TABLE IF NOT EXISTS trips (
  trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(route_id),
  bus_id UUID REFERENCES buses(bus_id),
  date DATE,
  departure_time TIME,
  arrival_time TIME,
  status TEXT,
  driver_id UUID REFERENCES users(user_id),
  branch_id UUID REFERENCES branches(branch_id)
);

-- =========================
-- Customers, Bookings, Payments
-- =========================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  trips_completed INT DEFAULT 0,
  loyalty_points NUMERIC DEFAULT 0,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  assistance_notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(trip_id),
  passenger_name TEXT,
  seat_number INT,
  booking_date TIMESTAMP DEFAULT now(),
  payment_status TEXT,
  booking_source TEXT,
  cancellation_reason TEXT,
  customer_id UUID REFERENCES customers(id),
  status TEXT DEFAULT 'Confirmed',
  nationality TEXT,
  id_passport TEXT,
  origin_stop TEXT,
  destination_stop TEXT,
  created_by_agent_id UUID,
  route_id UUID REFERENCES routes(route_id),
  bus_id UUID REFERENCES buses(bus_id),
  departure TIMESTAMP,
  arrival TIMESTAMP,
  ticket_type TEXT,
  ticket_issue_date TIMESTAMP,
  discount TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  ticket_code TEXT,
  boarded_at TIMESTAMP,
  branch_id UUID REFERENCES branches(branch_id)
);

CREATE TABLE IF NOT EXISTS payments (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(booking_id),
  amount NUMERIC,
  payment_method TEXT,
  paid_at TIMESTAMP,
  status TEXT,
  currency TEXT,
  transaction_ref TEXT
);

-- =========================
-- Support, Docs, Messaging, Incidents
-- =========================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(branch_id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  created_by UUID,
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  document_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Active',
  user_id UUID REFERENCES users(user_id),
  company_id UUID REFERENCES companies(company_id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  message_id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'General',
  from_user_id UUID REFERENCES users(user_id),
  to_user_id UUID REFERENCES users(user_id),
  company_id UUID REFERENCES companies(company_id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'Normal'
);

CREATE TABLE IF NOT EXISTS announcements (
  announcement_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'General',
  company_id UUID REFERENCES companies(company_id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_by TEXT,
  priority TEXT DEFAULT 'Normal'
);

CREATE TABLE IF NOT EXISTS incidents (
  incident_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'General',
  severity TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  location TEXT,
  incident_date TIMESTAMP WITH TIME ZONE,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  reported_by_user_id UUID REFERENCES users(user_id),
  assigned_to_user_id UUID REFERENCES users(user_id),
  resolution TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  location_label TEXT,
  company_id UUID REFERENCES companies(company_id),
  trip_id UUID REFERENCES trips(trip_id),
  bus_id UUID REFERENCES buses(bus_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE incidents ADD COLUMN latitude NUMERIC(10,7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE incidents ADD COLUMN longitude NUMERIC(10,7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'location_label'
  ) THEN
    ALTER TABLE incidents ADD COLUMN location_label TEXT;
  END IF;
END $$;

-- =========================
-- Billing & Subscriptions
-- =========================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  plan TEXT,
  amount NUMERIC,
  current_period_end TIMESTAMP,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  amount NUMERIC,
  status TEXT,
  issued_at TIMESTAMP DEFAULT now(),
  due_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  due_date TIMESTAMP,
  customer_name TEXT,
  last_reminder_at TIMESTAMP,
  reminder_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  title TEXT,
  message TEXT,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);

-- =========================
-- HR / Depot / Finance
-- =========================
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  action TEXT,
  entity TEXT,
  timestamp TIMESTAMP DEFAULT now(),
  details TEXT
);

CREATE TABLE IF NOT EXISTS driver_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  driver_id UUID REFERENCES drivers(driver_id),
  trip_id UUID REFERENCES trips(trip_id),
  items TEXT,
  passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lost_found (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(booking_id),
  trip_id UUID REFERENCES trips(trip_id),
  item_desc TEXT,
  status TEXT DEFAULT 'logged',
  contact TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_settings (
  company_id UUID PRIMARY KEY REFERENCES companies(company_id),
  logo_url TEXT,
  address TEXT,
  contact TEXT,
  notification_sms BOOLEAN DEFAULT FALSE,
  notification_email BOOLEAN DEFAULT TRUE,
  api_keys TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  speed_limit_kmh NUMERIC
);

CREATE TABLE IF NOT EXISTS customer_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  customer_id UUID REFERENCES customers(id),
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  trip_id UUID REFERENCES trips(trip_id),
  driver_id UUID REFERENCES drivers(driver_id),
  stop_index INT NOT NULL,
  reached_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  user_id UUID,
  type TEXT,
  description TEXT,
  message TEXT,
  meta TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Finance advanced modules
CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(route_id),
  rule_type TEXT,
  price_multiplier NUMERIC,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  code TEXT,
  description TEXT,
  discount_percent NUMERIC,
  discount_amount NUMERIC,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  max_redemptions INT,
  redeemed_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  promo_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  bookings INT,
  added_revenue NUMERIC,
  discount_cost NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_txns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES loyalty_wallets(id) ON DELETE CASCADE,
  type TEXT,
  amount NUMERIC,
  meta TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT,
  value NUMERIC,
  unit TEXT,
  captured_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT,
  assumption TEXT,
  impact TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subsidies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  program_name TEXT,
  period TEXT,
  claimed_amount NUMERIC,
  approved_amount NUMERIC,
  status TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS esg_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  type TEXT,
  cost NUMERIC,
  incentive NUMERIC,
  co2_saved_kg NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  start_date DATE,
  end_date DATE,
  expected_revenue NUMERIC,
  expected_cost NUMERIC,
  status TEXT
);

CREATE TABLE IF NOT EXISTS contract_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  period TEXT,
  revenue NUMERIC,
  cost NUMERIC,
  profit NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

-- Finance core
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(booking_id),
  amount NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  category TEXT,
  amount NUMERIC,
  route_id UUID REFERENCES routes(route_id),
  bus_id UUID REFERENCES buses(bus_id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  period TEXT,
  department TEXT,
  employee_count INT,
  gross NUMERIC,
  net NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  period TEXT,
  region TEXT,
  vat NUMERIC,
  sales_tax NUMERIC,
  total NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  period TEXT,
  scope TEXT,
  amount NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  period TEXT,
  metric TEXT,
  value NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cashflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  date DATE,
  opening NUMERIC,
  inflow NUMERIC,
  outflow NUMERIC,
  closing NUMERIC
);

CREATE TABLE IF NOT EXISTS route_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(route_id),
  bus_id UUID REFERENCES buses(bus_id),
  branch_id UUID REFERENCES branches(branch_id),
  cost_per_km NUMERIC,
  cost_per_passenger NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  type TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  lender TEXT,
  amount NUMERIC,
  interest_rate NUMERIC,
  installment NUMERIC,
  status TEXT,
  start_date DATE
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  value NUMERIC,
  depreciation_rate NUMERIC,
  acquired_at DATE
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT,
  category TEXT,
  contact TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  vendor_name TEXT,
  amount NUMERIC,
  due_date DATE,
  status TEXT DEFAULT 'unpaid',
  paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  policy_no TEXT,
  provider TEXT,
  renewal_date DATE
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  incident_id UUID,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- HR core
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(user_id),
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  status TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(user_id),
  branch_id UUID REFERENCES branches(branch_id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  role TEXT,
  status TEXT DEFAULT 'scheduled'
);

CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(user_id),
  period TEXT,
  base NUMERIC,
  overtime NUMERIC,
  bonus NUMERIC,
  deductions NUMERIC,
  net_pay NUMERIC,
  status TEXT DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(user_id),
  type TEXT,
  issued_at TIMESTAMP,
  expires_at TIMESTAMP,
  status TEXT
);

CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(user_id),
  type TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'applied',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(user_id),
  reviewer_id UUID REFERENCES users(user_id),
  period TEXT,
  rating NUMERIC,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(user_id),
  type TEXT,
  notes TEXT,
  action_date DATE,
  status TEXT
);

-- Depot / Maintenance / Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  item TEXT,
  quantity NUMERIC,
  unit TEXT,
  min_threshold NUMERIC DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  item TEXT,
  bus_id UUID REFERENCES buses(bus_id),
  quantity NUMERIC,
  used_at TIMESTAMP DEFAULT now(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  item TEXT,
  quantity NUMERIC,
  status TEXT DEFAULT 'ordered',
  expected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  staff_name TEXT,
  role TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(bus_id),
  title TEXT,
  priority TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT now(),
  type TEXT,
  staff_id UUID REFERENCES users(user_id),
  labor_hours NUMERIC,
  labor_rate NUMERIC,
  parts_cost NUMERIC,
  total_cost NUMERIC,
  vendor_id UUID REFERENCES vendors(id),
  outsourced BOOLEAN DEFAULT FALSE,
  outsourced_notes TEXT
);

CREATE TABLE IF NOT EXISTS repair_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(bus_id),
  incident_id UUID,
  notes TEXT,
  parts_used TEXT,
  duration_hours NUMERIC,
  labor_cost NUMERIC,
  parts_cost NUMERIC,
  total_cost NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(bus_id),
  liters NUMERIC,
  cost_per_liter NUMERIC,
  filled_at TIMESTAMP DEFAULT now(),
  pump_id TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS workshop_bays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS workshop_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  bay_id UUID REFERENCES workshop_bays(id),
  task_id UUID REFERENCES maintenance_tasks(id),
  started_at TIMESTAMP DEFAULT now(),
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS depot_delay_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(trip_id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS predictive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(bus_id),
  alert_type TEXT,
  severity TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_kb (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  tags TEXT[],
  media_urls TEXT[],
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recycling_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  item TEXT,
  quantity NUMERIC,
  unit TEXT,
  recycled_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_carbon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(bus_id),
  scope TEXT,
  amount_kg NUMERIC,
  logged_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_permissions (
  user_id UUID REFERENCES users(user_id),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  module TEXT,
  can_view BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, module)
);

-- Approvals & Requests
CREATE TABLE IF NOT EXISTS approvals (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  requested_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  approval_notes TEXT,
  rejection_notes TEXT,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS route_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  requested_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(bus_id) ON DELETE CASCADE,
  work_type TEXT NOT NULL,
  description TEXT,
  estimated_cost DECIMAL(10,2),
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending_approval',
  requested_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  department TEXT,
  status TEXT DEFAULT 'pending_approval',
  requested_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Global communications
CREATE TABLE IF NOT EXISTS global_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  target_roles TEXT[],
  target_branches UUID[],
  channels TEXT[],
  scheduled_for TIMESTAMP,
  expires_at TIMESTAMP,
  sent_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  channels TEXT[],
  enabled BOOLEAN DEFAULT TRUE,
  template TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(company_id, role, event_type)
);

CREATE TABLE IF NOT EXISTS message_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_support_tickets_company ON support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_branch ON support_tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_company_id ON messages(company_id);
CREATE INDEX IF NOT EXISTS idx_messages_company_created ON messages(company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_announcements_company_id ON announcements(company_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);

CREATE INDEX IF NOT EXISTS idx_incidents_company_id ON incidents(company_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_company_created ON incidents(company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_date ON bookings(trip_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_branch_only ON bookings(branch_id);
-- Prevent double-seat assignment except when booking is cancelled
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_seat_per_trip
  ON bookings(trip_id, seat_number)
  WHERE COALESCE(status,'Confirmed') <> 'Cancelled';
CREATE INDEX IF NOT EXISTS idx_payments_booking_paid_at ON payments(booking_id, paid_at, status);
CREATE INDEX IF NOT EXISTS idx_trips_route_departure ON trips(route_id, departure_time);

CREATE INDEX IF NOT EXISTS idx_approvals_company_status ON approvals(company_id, status);
CREATE INDEX IF NOT EXISTS idx_route_requests_company_status ON route_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_company_status ON maintenance_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_hr_requests_company_status ON hr_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_global_messages_company_created ON global_messages(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_policies_company_role ON notification_policies(company_id, role);
CREATE INDEX IF NOT EXISTS idx_activity_log_company_created ON activity_log(company_id, created_at);

-- =========================
-- Views
-- =========================
CREATE OR REPLACE VIEW trips_with_details AS
SELECT
  t.trip_id,
  t.date,
  t.departure_time,
  t.arrival_time,
  t.status,
  t.driver_id,
  t.branch_id,
  r.route_id,
  r.origin,
  r.destination,
  COALESCE(rc.company_id, r.company_id) AS company_id,
  b.bus_id,
  b.license_plate,
  (SELECT count(*)::int FROM bookings bk WHERE bk.trip_id = t.trip_id AND COALESCE(bk.status,'') <> 'Cancelled') AS passenger_count
FROM trips t
JOIN routes r ON r.route_id = t.route_id
LEFT JOIN route_companies rc ON rc.route_id = r.route_id
LEFT JOIN buses b ON b.bus_id = t.bus_id;

CREATE OR REPLACE VIEW trips_with_company AS
SELECT 
  tr.trip_id,
  tr.route_id,
  tr.bus_id,
  tr.date,
  tr.departure_time,
  tr.arrival_time,
  tr.status,
  tr.driver_id,
  tr.branch_id,
  ro.company_id,
  ro.origin,
  ro.destination
FROM trips tr
JOIN routes ro ON ro.route_id = tr.route_id;

CREATE OR REPLACE VIEW payments_with_company AS
SELECT 
  p.transaction_id,
  p.booking_id,
  p.amount,
  p.payment_method,
  p.paid_at,
  p.status,
  ro.company_id
FROM payments p
JOIN bookings b ON b.booking_id = p.booking_id
JOIN trips tr ON tr.trip_id = b.trip_id
JOIN routes ro ON ro.route_id = tr.route_id;

CREATE OR REPLACE VIEW bookings_with_company AS
SELECT 
  b.booking_id,
  b.trip_id,
  b.route_id,
  b.bus_id,
  b.passenger_name,
  b.seat_number,
  b.booking_date,
  b.payment_status,
  b.booking_source,
  b.cancellation_reason,
  b.customer_id,
  b.status,
  b.ticket_code,
  b.ticket_type,
  b.ticket_issue_date,
  b.boarded_at,
  b.nationality,
  b.id_passport,
  b.departure,
  b.arrival,
  b.origin_stop,
  b.destination_stop,
  b.created_by_agent_id,
  ro.company_id
FROM bookings b
JOIN trips tr ON tr.trip_id = b.trip_id
JOIN routes ro ON ro.route_id = tr.route_id;

CREATE OR REPLACE VIEW trip_occupancy AS
SELECT tr.trip_id,
       tr.date AS trip_date,
       ro.company_id,
       COUNT(b.booking_id) AS seats_sold,
       bu.capacity,
       CASE WHEN bu.capacity > 0 THEN (COUNT(b.booking_id)::NUMERIC / bu.capacity::NUMERIC) * 100 ELSE 0 END AS occupancy_pct
FROM trips tr
JOIN routes ro ON ro.route_id = tr.route_id
JOIN buses bu ON bu.bus_id = tr.bus_id
LEFT JOIN bookings b ON b.trip_id = tr.trip_id AND COALESCE(b.status,'') <> 'Cancelled'
GROUP BY tr.trip_id, tr.date, ro.company_id, bu.capacity;

CREATE OR REPLACE VIEW monthly_company_revenue AS
SELECT ro.company_id,
       date_trunc('month', p.paid_at) AS month,
       SUM(p.amount) AS revenue
FROM payments p
JOIN bookings b ON b.booking_id = p.booking_id
JOIN trips tr ON tr.trip_id = b.trip_id
JOIN routes ro ON ro.route_id = tr.route_id
WHERE p.status = 'paid'
GROUP BY ro.company_id, date_trunc('month', p.paid_at)
ORDER BY date_trunc('month', p.paid_at);

CREATE OR REPLACE VIEW company_rankings AS
SELECT c.company_id,
       c.name,
       COALESCE(r.route_count, 0) + COALESCE(t.trip_count, 0) AS score
FROM companies c
LEFT JOIN (
  SELECT company_id, COUNT(*) AS route_count FROM routes GROUP BY company_id
) r ON r.company_id = c.company_id
LEFT JOIN (
  SELECT ro.company_id, COUNT(*) AS trip_count
  FROM trips tr
  JOIN routes ro ON tr.route_id = ro.route_id
  GROUP BY ro.company_id
) t ON t.company_id = c.company_id
ORDER BY score DESC;

CREATE OR REPLACE VIEW route_rankings AS
SELECT ro.route_id,
       ro.company_id,
       (ro.origin || '-' || ro.destination) AS name,
       COALESCE(COUNT(b.booking_id), 0) AS score
FROM routes ro
LEFT JOIN trips tr ON tr.route_id = ro.route_id
LEFT JOIN bookings b ON b.trip_id = tr.trip_id AND COALESCE(b.status,'') <> 'Cancelled'
GROUP BY ro.route_id, ro.company_id, name
ORDER BY score DESC;

CREATE OR REPLACE VIEW finance_drilldown AS
SELECT ro.company_id,
       br.branch_id,
       tr.route_id,
       tr.bus_id,
       p.paid_at::date AS date,
       p.amount
FROM payments p
JOIN bookings b ON b.booking_id = p.booking_id
JOIN trips tr ON tr.trip_id = b.trip_id
JOIN routes ro ON ro.route_id = tr.route_id
LEFT JOIN branches br ON br.branch_id = tr.branch_id
WHERE p.status = 'paid';

-- Stub views required by admin RPCs
CREATE OR REPLACE VIEW fleet_utilization AS SELECT NULL::uuid AS company_id, NULL::numeric AS utilization_pct WHERE false;
CREATE OR REPLACE VIEW depot_readiness AS SELECT NULL::uuid AS company_id, NULL::numeric AS readiness_pct WHERE false;
CREATE OR REPLACE VIEW driver_kpis AS SELECT NULL::uuid AS company_id, NULL::numeric AS on_time_score WHERE false;
CREATE OR REPLACE VIEW maintenance_kpis AS SELECT NULL::uuid AS company_id, NULL::numeric AS downtime_pct WHERE false;
CREATE OR REPLACE VIEW hr_kpis AS SELECT NULL::uuid AS company_id, NULL::numeric AS turnover_rate WHERE false;

-- =========================
-- RPCs
-- =========================
CREATE OR REPLACE FUNCTION record_inspection(p_company_id UUID, p_driver_id UUID, p_trip_id UUID, p_items TEXT, p_passed BOOLEAN)
RETURNS UUID AS $$
DECLARE v_id UUID; BEGIN
  INSERT INTO driver_inspections(company_id, driver_id, trip_id, items, passed)
  VALUES (p_company_id, p_driver_id, p_trip_id, p_items, p_passed)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_assigned_bus_for_driver(p_driver_id UUID)
RETURNS TABLE(bus_id UUID, license_plate TEXT, capacity INT, status TEXT, fuel_level NUMERIC) AS $$
  SELECT b.bus_id, b.license_plate, b.capacity, b.status, NULL::NUMERIC AS fuel_level
  FROM drivers d
  JOIN buses b ON b.bus_id = d.assigned_bus_id
  WHERE d.driver_id = p_driver_id
  LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION compute_dynamic_price(p_company_id UUID, p_route_id UUID, p_base NUMERIC, p_at TIMESTAMP)
RETURNS NUMERIC AS $$
DECLARE v NUMERIC := p_base; BEGIN
  SELECT p_base * COALESCE(MAX(price_multiplier),1) INTO v
  FROM dynamic_pricing_rules
  WHERE company_id = p_company_id AND route_id = p_route_id
    AND p_at BETWEEN COALESCE(starts_at, '-infinity') AND COALESCE(ends_at, 'infinity');
  RETURN v;
END; $$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION apply_promo(p_company_id UUID, p_code TEXT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE d NUMERIC := 0; v_id UUID; v_left INT; BEGIN
  SELECT id, COALESCE(max_redemptions,0) - COALESCE(redeemed_count,0)
  INTO v_id, v_left
  FROM promotions
  WHERE company_id = p_company_id AND code = p_code AND is_active = TRUE
    AND now() BETWEEN COALESCE(starts_at, '-infinity') AND COALESCE(ends_at, 'infinity')
  LIMIT 1;
  IF v_id IS NULL OR v_left < 0 THEN RETURN p_amount; END IF;
  SELECT COALESCE(p_amount * (discount_percent/100.0), 0) + COALESCE(discount_amount,0) INTO d FROM promotions WHERE id = v_id;
  UPDATE promotions SET redeemed_count = COALESCE(redeemed_count,0) + 1 WHERE id = v_id;
  RETURN GREATEST(p_amount - d, 0);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION commission_due(p_company_id UUID, p_start TIMESTAMP, p_end TIMESTAMP)
RETURNS NUMERIC AS $$
DECLARE total NUMERIC := 2000; BEGIN
  SELECT 2000 + COALESCE(SUM(p.amount) * 0.035, 0)
    INTO total
  FROM payments p
  JOIN bookings b ON b.booking_id = p.booking_id
  JOIN trips tr ON tr.trip_id = b.trip_id
  JOIN routes ro ON ro.route_id = tr.route_id
  WHERE ro.company_id = p_company_id
    AND p.paid_at BETWEEN p_start AND p_end
    AND p.status = 'paid';
  RETURN total;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION dev_create_company_with_admin(
  p_name TEXT,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_admin_name TEXT DEFAULT NULL,
  p_admin_email TEXT DEFAULT NULL,
  p_admin_password TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_company_id UUID; v_user_id UUID; BEGIN
  INSERT INTO companies(name, is_active) VALUES (p_name, COALESCE(p_is_active, TRUE)) RETURNING company_id INTO v_company_id;
  IF p_admin_email IS NOT NULL AND length(p_admin_email) > 0 THEN
    v_user_id := gen_random_uuid();
    INSERT INTO users(user_id, company_id, role, name, email, is_active, password_hash)
    VALUES (v_user_id, v_company_id, 'admin', COALESCE(p_admin_name,'Admin'), p_admin_email, TRUE, COALESCE(p_admin_password,'Temp123!'));
  END IF;
  RETURN v_company_id;
END; $$;

CREATE OR REPLACE FUNCTION get_available_seats(p_trip_id UUID)
RETURNS TABLE(seat_number INT) AS $$
DECLARE v_capacity INT; BEGIN
  SELECT b.capacity INTO v_capacity
  FROM trips t JOIN buses b ON b.bus_id = t.bus_id
  WHERE t.trip_id = p_trip_id;
  RETURN QUERY
  SELECT s FROM generate_series(1, COALESCE(v_capacity, 0)) AS s
  EXCEPT
  SELECT seat_number FROM bookings WHERE trip_id = p_trip_id AND COALESCE(status,'Confirmed') <> 'Cancelled';
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_booking(
  p_trip_id UUID,
  p_company_id UUID,
  p_passenger_name TEXT,
  p_phone TEXT,
  p_id_number TEXT,
  p_seat_number INT,
  p_payment_status TEXT,
  p_source TEXT
) RETURNS UUID AS $$
DECLARE v_exists INT; v_booking_id UUID; v_customer_id UUID; BEGIN
  SELECT COUNT(*) INTO v_exists FROM bookings WHERE trip_id = p_trip_id AND seat_number = p_seat_number AND COALESCE(status,'Confirmed') <> 'Cancelled';
  IF v_exists > 0 THEN RAISE EXCEPTION 'Seat already taken'; END IF;

  IF p_phone IS NOT NULL AND length(p_phone) > 0 THEN
    SELECT id INTO v_customer_id FROM customers WHERE company_id = p_company_id AND phone = p_phone LIMIT 1;
    IF v_customer_id IS NULL THEN
      INSERT INTO customers(company_id, name, phone) VALUES (p_company_id, p_passenger_name, p_phone) RETURNING id INTO v_customer_id;
    END IF;
  END IF;

  INSERT INTO bookings(trip_id, passenger_name, seat_number, payment_status, booking_source, customer_id)
  VALUES (p_trip_id, p_passenger_name, p_seat_number, COALESCE(p_payment_status,'unpaid'), COALESCE(p_source,'app'), v_customer_id)
  RETURNING booking_id INTO v_booking_id;

  IF v_customer_id IS NOT NULL THEN
    UPDATE customers SET trips_completed = COALESCE(trips_completed,0) + 1 WHERE id = v_customer_id;
  END IF;
  RETURN v_booking_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID, p_reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE bookings SET status = 'Cancelled', cancellation_reason = p_reason WHERE booking_id = p_booking_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reschedule_booking(p_booking_id UUID, p_new_trip_id UUID, p_new_seat INT)
RETURNS VOID AS $$
DECLARE v_exists INT; BEGIN
  SELECT COUNT(*) INTO v_exists FROM bookings WHERE trip_id = p_new_trip_id AND seat_number = p_new_seat AND COALESCE(status,'Confirmed') <> 'Cancelled';
  IF v_exists > 0 THEN RAISE EXCEPTION 'Seat already taken on new trip'; END IF;
  UPDATE bookings SET trip_id = p_new_trip_id, seat_number = p_new_seat, status = 'Confirmed' WHERE booking_id = p_booking_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_payment(p_booking_id UUID, p_method TEXT, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  INSERT INTO payments(booking_id, amount, payment_method, paid_at, status)
  VALUES (p_booking_id, p_amount, p_method, now(), 'paid');
  UPDATE bookings SET payment_status = 'paid' WHERE booking_id = p_booking_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION adjust_loyalty_points(p_customer_id UUID, p_delta NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE customers SET loyalty_points = COALESCE(loyalty_points,0) + COALESCE(p_delta,0)
  WHERE id = p_customer_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_report(p_company_id UUID, p_start TIMESTAMP, p_end TIMESTAMP)
RETURNS TABLE(total_bookings INT, total_revenue NUMERIC, seats_sold INT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(b.booking_id) AS total_bookings,
    COALESCE(SUM(p.amount), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN b.status <> 'Cancelled' THEN 1 ELSE 0 END), 0) AS seats_sold
  FROM bookings b
  JOIN trips tr ON tr.trip_id = b.trip_id
  JOIN routes ro ON ro.route_id = tr.route_id
  LEFT JOIN payments p ON p.booking_id = b.booking_id AND p.status = 'paid'
  WHERE ro.company_id = p_company_id AND b.booking_date BETWEEN p_start AND p_end;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION finance_revenue_by_day(p_company_id UUID)
RETURNS TABLE(day DATE, amount NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT date_trunc('day', p.paid_at)::date AS day, COALESCE(SUM(p.amount),0) AS amount
  FROM payments p
  JOIN bookings b ON b.booking_id = p.booking_id
  JOIN trips tr ON tr.trip_id = b.trip_id
  JOIN routes ro ON ro.route_id = tr.route_id
  WHERE ro.company_id = p_company_id AND p.status = 'paid'
  GROUP BY 1
  ORDER BY 1 DESC
$$;

CREATE OR REPLACE FUNCTION finance_revenue_by_route(p_company_id UUID)
RETURNS TABLE(route_id UUID, revenue NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT ro.route_id, COALESCE(SUM(p.amount),0) AS revenue
  FROM payments p
  JOIN bookings b ON b.booking_id = p.booking_id
  JOIN trips tr ON tr.trip_id = b.trip_id
  JOIN routes ro ON ro.route_id = tr.route_id
  WHERE ro.company_id = p_company_id AND p.status = 'paid'
  GROUP BY ro.route_id
  ORDER BY revenue DESC
$$;

CREATE OR REPLACE FUNCTION finance_expenses_by_type(p_company_id UUID)
RETURNS TABLE(category TEXT, total NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT e.category, COALESCE(SUM(e.amount),0) AS total
  FROM expenses e
  WHERE e.company_id = p_company_id
  GROUP BY e.category
  ORDER BY total DESC
$$;

CREATE OR REPLACE FUNCTION finance_kpis(p_company_id UUID)
RETURNS TABLE(name TEXT, value NUMERIC, unit TEXT)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    SELECT 'Revenue (30d)'::text AS name, COALESCE(SUM(p.amount),0)::numeric AS value, 'currency'::text AS unit
    FROM payments p
    JOIN bookings b ON b.booking_id = p.booking_id
    JOIN trips tr ON tr.trip_id = b.trip_id
    JOIN routes ro ON ro.route_id = tr.route_id
    WHERE ro.company_id = p_company_id AND p.status='paid' AND p.paid_at >= now() - interval '30 days'
  ) a
  UNION ALL
  SELECT 'Expenses (30d)', COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.company_id = p_company_id AND e.created_at >= now() - interval '30 days'),0), 'currency'
  UNION ALL
  SELECT 'Profit (30d)', COALESCE((
    SELECT COALESCE(SUM(p.amount),0) FROM payments p
    JOIN bookings b ON b.booking_id = p.booking_id
    JOIN trips tr ON tr.trip_id = b.trip_id
    JOIN routes ro ON ro.route_id = tr.route_id
    WHERE ro.company_id = p_company_id AND p.status='paid' AND p.paid_at >= now() - interval '30 days'
  ),0) - COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.company_id = p_company_id AND e.created_at >= now() - interval '30 days'),0), 'currency';
END;
$$;

CREATE OR REPLACE FUNCTION route_profitability(p_company_id UUID)
RETURNS TABLE(route_id UUID, revenue NUMERIC, cost NUMERIC, margin NUMERIC)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT x.route_id,
         x.revenue,
         y.cost,
         CASE WHEN y.cost > 0 THEN ROUND((x.revenue - y.cost) / y.cost * 100, 2) ELSE NULL END AS margin
  FROM (
    SELECT ro.route_id, COALESCE(SUM(p.amount),0) AS revenue
    FROM payments p
    JOIN bookings b ON b.booking_id = p.booking_id
    JOIN trips tr ON tr.trip_id = b.trip_id
    JOIN routes ro ON ro.route_id = tr.route_id
    WHERE ro.company_id = p_company_id AND p.status='paid'
    GROUP BY ro.route_id
  ) x
  LEFT JOIN (
    SELECT e.route_id, COALESCE(SUM(e.amount),0) AS cost
    FROM expenses e
    WHERE e.company_id = p_company_id
    GROUP BY e.route_id
  ) y ON y.route_id = x.route_id;
END;
$$;

CREATE OR REPLACE FUNCTION send_invoice_reminder(p_invoice_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE invoices
  SET last_reminder_at = now(), reminder_count = COALESCE(reminder_count,0) + 1
  WHERE id = p_invoice_id;
END; $$ LANGUAGE plpgsql;

-- Admin oversight RPCs (safe joins)
CREATE OR REPLACE FUNCTION admin_bookings_today(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(b.booking_id)::numeric
  FROM bookings b
  JOIN trips tr ON tr.trip_id = b.trip_id
  JOIN routes ro ON ro.route_id = tr.route_id
  WHERE ro.company_id = admin_bookings_today.company_id
    AND b.booking_date::date = now()::date
    AND COALESCE(b.status,'') <> 'Cancelled';
$$;

CREATE OR REPLACE FUNCTION admin_large_refunds_pending(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM refunds WHERE company_id = admin_large_refunds_pending.company_id AND amount >= 1000 AND status = 'pending_approval';
$$;

CREATE OR REPLACE FUNCTION admin_reconciliation_status(company_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE status TEXT; BEGIN
  status := 'OK';
  RETURN status;
END;$$;

CREATE OR REPLACE FUNCTION admin_blacklist_overrides_today(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM activity_log
  WHERE company_id = admin_blacklist_overrides_today.company_id AND type = 'blacklist_override' AND created_at::date = now()::date;
$$;

CREATE OR REPLACE FUNCTION admin_boarding_incidents_today(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM incidents WHERE company_id = admin_boarding_incidents_today.company_id AND reported_at::date = now()::date;
$$;

CREATE OR REPLACE FUNCTION admin_seat_utilization_pct(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(AVG(occupancy_pct),0) FROM trip_occupancy WHERE company_id = admin_seat_utilization_pct.company_id;
$$;

CREATE OR REPLACE FUNCTION admin_boarding_delays(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM trips_with_company WHERE company_id = admin_boarding_delays.company_id AND status = 'delayed';
$$;

CREATE OR REPLACE FUNCTION admin_driver_trip_completion(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)*100,0) FROM trips_with_company WHERE company_id = admin_driver_trip_completion.company_id;
$$;

CREATE OR REPLACE FUNCTION admin_driver_accidents_today(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM incidents WHERE company_id = admin_driver_accidents_today.company_id AND type = 'accident' AND reported_at::date = now()::date;
$$;

CREATE OR REPLACE FUNCTION admin_driver_on_time_score(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(AVG(on_time_score),0) FROM driver_kpis WHERE company_id = admin_driver_on_time_score.company_id;
$$;

CREATE OR REPLACE FUNCTION admin_driver_expired_certs(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM certifications WHERE company_id = admin_driver_expired_certs.company_id AND expires_at < now();
$$;

CREATE OR REPLACE FUNCTION admin_route_approvals_pending(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM route_requests WHERE company_id = admin_route_approvals_pending.company_id AND status = 'pending';
$$;

CREATE OR REPLACE FUNCTION admin_dead_mileage_km(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(0),0);
$$;

CREATE OR REPLACE FUNCTION admin_utilization_pct(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(AVG(utilization_pct),0) FROM fleet_utilization WHERE company_id = admin_utilization_pct.company_id;
$$;

CREATE OR REPLACE FUNCTION admin_depot_staff_shortages(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM staff_shifts WHERE company_id = admin_depot_staff_shortages.company_id AND status = 'shortage';
$$;

CREATE OR REPLACE FUNCTION admin_buses_down(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM buses WHERE company_id = admin_buses_down.company_id AND status IN ('maintenance','repair');
$$;

CREATE OR REPLACE FUNCTION admin_depot_readiness_pct(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(AVG(readiness_pct),0) FROM depot_readiness WHERE company_id = admin_depot_readiness_pct.company_id;
$$;

CREATE OR REPLACE FUNCTION admin_maintenance_major_approvals(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM maintenance_requests WHERE company_id = admin_maintenance_major_approvals.company_id AND status = 'pending_approval';
$$;

CREATE OR REPLACE FUNCTION admin_maintenance_downtime_pct(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(AVG(downtime_pct),0) FROM maintenance_kpis WHERE company_id = admin_maintenance_downtime_pct.company_id;
$$;

CREATE OR REPLACE FUNCTION admin_maintenance_month_cost(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(total_cost),0) FROM maintenance_tasks
  WHERE company_id = admin_maintenance_month_cost.company_id
    AND date_trunc('month', created_at) = date_trunc('month', now());
$$;

CREATE OR REPLACE FUNCTION admin_finance_pnl_month(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  WITH revenue AS (
    SELECT COALESCE(SUM(amount),0) AS total
    FROM finance_drilldown
    WHERE company_id = admin_finance_pnl_month.company_id
      AND date_trunc('month', date) = date_trunc('month', now())
  ),
  expense AS (
    SELECT COALESCE(SUM(e.amount),0) AS total
    FROM expenses e
    WHERE e.company_id = admin_finance_pnl_month.company_id
      AND date_trunc('month', e.created_at) = date_trunc('month', now())
  )
  SELECT COALESCE(r.total,0) - COALESCE(x.total,0) FROM revenue r CROSS JOIN expense x;
$$;

CREATE OR REPLACE FUNCTION admin_finance_high_risk_refunds(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM refunds WHERE company_id = admin_finance_high_risk_refunds.company_id AND amount >= 1000 AND status = 'pending_approval';
$$;

CREATE OR REPLACE FUNCTION admin_finance_large_expenses_pending(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM expenses WHERE company_id = admin_finance_large_expenses_pending.company_id AND amount >= 1000 AND status = 'pending_approval';
$$;

CREATE OR REPLACE FUNCTION admin_hr_critical_hires(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM hr_requests WHERE company_id = admin_hr_critical_hires.company_id AND action = 'hire' AND status = 'pending_approval';
$$;

CREATE OR REPLACE FUNCTION admin_hr_payroll_adjustments_pending(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM payroll WHERE company_id = admin_hr_payroll_adjustments_pending.company_id AND status = 'pending_approval';
$$;

CREATE OR REPLACE FUNCTION admin_hr_turnover_rate(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(AVG(turnover_rate),0) FROM hr_kpis WHERE company_id = admin_hr_turnover_rate.company_id;
$$;

CREATE OR REPLACE FUNCTION admin_alerts_escalations_today(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM activity_log WHERE company_id = admin_alerts_escalations_today.company_id AND type LIKE 'escalation%' AND created_at::date = now()::date;
$$;

CREATE OR REPLACE FUNCTION admin_alerts_broadcasts_today(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM global_messages WHERE company_id = admin_alerts_broadcasts_today.company_id AND created_at::date = now()::date;
$$;

CREATE OR REPLACE FUNCTION admin_alert_rules_count(company_id UUID)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::numeric FROM notification_policies WHERE company_id = admin_alert_rules_count.company_id AND enabled = true;
$$;

-- =========================
-- Triggers
-- =========================
CREATE OR REPLACE FUNCTION fn_log_activity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO activity_log(company_id, user_id, type, description, message, meta, created_at)
  VALUES (
    COALESCE(NEW.company_id, OLD.company_id),
    NULL,
    TG_ARGV[0],
    TG_ARGV[1],
    NULL,
    NULL,
    now()
  );
  RETURN NEW;
END;$$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS trg_bookings_log ON bookings;
  CREATE TRIGGER trg_bookings_log AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_log_activity('booking','Booking created/updated');
  
  DROP TRIGGER IF EXISTS trg_refunds_log ON refunds;
  CREATE TRIGGER trg_refunds_log AFTER INSERT OR UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION fn_log_activity('refund','Refund created/updated');
  
  DROP TRIGGER IF EXISTS trg_maint_req_log ON maintenance_requests;
  CREATE TRIGGER trg_maint_req_log AFTER INSERT OR UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION fn_log_activity('maintenance_request','Maintenance request updated');
  
  DROP TRIGGER IF EXISTS trg_hr_req_log ON hr_requests;
  CREATE TRIGGER trg_hr_req_log AFTER INSERT OR UPDATE ON hr_requests
  FOR EACH ROW EXECUTE FUNCTION fn_log_activity('hr_request','HR request updated');
END $$;

-- =========================
-- Seeds (minimal)
-- =========================
INSERT INTO countries (code, name) VALUES
('ZA','South Africa'),('ZW','Zimbabwe'),('ZM','Zambia')
ON CONFLICT (code) DO NOTHING;

INSERT INTO cities (country_id, name)
SELECT (SELECT id FROM countries WHERE code='ZA'), name FROM (
  SELECT unnest(ARRAY['Cape Town','Johannesburg','Durban','Pretoria']) AS name
) s
ON CONFLICT DO NOTHING;

-- Backfill routes to route_companies
INSERT INTO route_companies(route_id, company_id)
SELECT route_id, company_id FROM routes WHERE company_id IS NOT NULL
ON CONFLICT (route_id, company_id) DO NOTHING;
