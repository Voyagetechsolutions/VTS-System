-- Create missing tables for Admin Dashboard
-- Run this script in Supabase SQL Editor

-- 1. Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  type VARCHAR(50) DEFAULT 'service', -- 'safety', 'service', 'maintenance', 'other'
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  reported_by UUID REFERENCES users(user_id),
  assigned_to UUID REFERENCES users(user_id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_company ON incidents(company_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

-- 2. Refunds table (if not exists)
CREATE TABLE IF NOT EXISTS refunds (
  refund_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(booking_id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  reason TEXT,
  requested_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_booking ON refunds(booking_id);

-- 3. Route requests table
CREATE TABLE IF NOT EXISTS route_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  route_name VARCHAR(255),
  origin VARCHAR(255),
  destination VARCHAR(255),
  request_type VARCHAR(50) DEFAULT 'new', -- 'new', 'modify', 'delete'
  requested_by UUID REFERENCES users(user_id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_route_requests_status ON route_requests(status);
CREATE INDEX IF NOT EXISTS idx_route_requests_company ON route_requests(company_id);

-- 4. Maintenance requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(bus_id),
  company_id UUID REFERENCES companies(company_id),
  issue TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'in_progress', 'completed', 'rejected'
  requested_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_bus ON maintenance_requests(bus_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);

-- 5. HR actions table
CREATE TABLE IF NOT EXISTS hr_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  employee_id UUID REFERENCES users(user_id),
  action_type VARCHAR(50) NOT NULL, -- 'leave_request', 'promotion', 'termination', 'salary_adjustment', 'transfer'
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  effective_date DATE,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_hr_actions_status ON hr_actions(status);
CREATE INDEX IF NOT EXISTS idx_hr_actions_employee ON hr_actions(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_actions_type ON hr_actions(action_type);

-- 6. Staff table (if not exists)
CREATE TABLE IF NOT EXISTS staff (
  staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  user_id UUID REFERENCES users(user_id),
  role VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'on_leave', 'suspended'
  shift_start TIME,
  shift_end TIME,
  hire_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_company ON staff(company_id);
CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- Enable RLS on all tables
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company admins and developers
-- Incidents
CREATE POLICY "Company admins can view their incidents"
ON incidents FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

CREATE POLICY "Company admins can manage their incidents"
ON incidents FOR ALL
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

-- Refunds
CREATE POLICY "Company admins can view their refunds"
ON refunds FOR SELECT
TO authenticated
USING (
  booking_id IN (SELECT booking_id FROM bookings WHERE company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

CREATE POLICY "Company admins can manage their refunds"
ON refunds FOR ALL
TO authenticated
USING (
  booking_id IN (SELECT booking_id FROM bookings WHERE company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

-- Route requests
CREATE POLICY "Company admins can view their route requests"
ON route_requests FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

CREATE POLICY "Company admins can manage their route requests"
ON route_requests FOR ALL
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

-- Maintenance requests
CREATE POLICY "Company admins can view their maintenance requests"
ON maintenance_requests FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

CREATE POLICY "Company admins can manage their maintenance requests"
ON maintenance_requests FOR ALL
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

-- HR actions
CREATE POLICY "Company admins can view their HR actions"
ON hr_actions FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

CREATE POLICY "Company admins can manage their HR actions"
ON hr_actions FOR ALL
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

-- Staff
CREATE POLICY "Company admins can view their staff"
ON staff FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

CREATE POLICY "Company admins can manage their staff"
ON staff FOR ALL
TO authenticated
USING (
  company_id IN (SELECT company_id FROM users WHERE auth_user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'developer')
);

-- Verify tables were created
SELECT 
  'Tables created successfully' as status,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_name IN ('incidents', 'refunds', 'route_requests', 'maintenance_requests', 'hr_actions', 'staff')
AND table_schema = 'public';
