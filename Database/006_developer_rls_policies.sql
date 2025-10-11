-- Developer Dashboard RLS Policies
-- This script creates RLS policies that allow developers to access all data across companies

-- ============================================================================
-- IMPORTANT: Developer Role Setup
-- ============================================================================
-- Developers need to bypass company-scoped RLS to see all data
-- This assumes you have a 'role' column in your users table

-- ============================================================================
-- DROP EXISTING POLICIES (if they exist)
-- ============================================================================
DROP POLICY IF EXISTS "Developers can view all activity logs" ON activity_log;
DROP POLICY IF EXISTS "Developers can view all companies" ON companies;
DROP POLICY IF EXISTS "Developers can update all companies" ON companies;
DROP POLICY IF EXISTS "Developers can view all users" ON users;
DROP POLICY IF EXISTS "Developers can update all users" ON users;
DROP POLICY IF EXISTS "Developers can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Developers can view all buses" ON buses;
DROP POLICY IF EXISTS "Developers can view all routes" ON routes;
DROP POLICY IF EXISTS "Developers can view all payments" ON payments;
DROP POLICY IF EXISTS "Developers can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Developers can update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Developers can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Developers can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Developers can update all announcements" ON announcements;
DROP POLICY IF EXISTS "Developers can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Developers can view platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Developers can update platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Developers can insert companies" ON companies;
DROP POLICY IF EXISTS "Developers can insert users" ON users;

-- ============================================================================
-- Activity Log - Allow developers to see all logs
-- ============================================================================
CREATE POLICY "Developers can view all activity logs"
ON activity_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Companies - Allow developers to manage all companies
-- ============================================================================
CREATE POLICY "Developers can view all companies"
ON companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can update all companies"
ON companies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Users - Allow developers to view and manage all users
-- ============================================================================
CREATE POLICY "Developers can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.user_id = auth.uid()
    AND u.role = 'developer'
  )
);

CREATE POLICY "Developers can update all users"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.user_id = auth.uid()
    AND u.role = 'developer'
  )
);

-- ============================================================================
-- Bookings - Allow developers to view all bookings
-- ============================================================================
CREATE POLICY "Developers can view all bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Buses - Allow developers to view all buses
-- ============================================================================
CREATE POLICY "Developers can view all buses"
ON buses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Routes - Allow developers to view all routes
-- ============================================================================
CREATE POLICY "Developers can view all routes"
ON routes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Payments - Allow developers to view all payments
-- ============================================================================
CREATE POLICY "Developers can view all payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Subscriptions - Allow developers to manage all subscriptions
-- ============================================================================
CREATE POLICY "Developers can view all subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can update all subscriptions"
ON subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Announcements - Allow developers to manage all announcements
-- ============================================================================
CREATE POLICY "Developers can view all announcements"
ON announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can insert announcements"
ON announcements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can update all announcements"
ON announcements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can delete announcements"
ON announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Platform Settings - Allow developers to manage platform settings
-- ============================================================================
CREATE POLICY "Developers can view platform settings"
ON platform_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can update platform settings"
ON platform_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- ============================================================================
-- Additional INSERT Policies for Creating Data
-- ============================================================================
CREATE POLICY "Developers can insert companies"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.user_id = auth.uid()
    AND u.role = 'developer'
  )
);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. These policies assume you have a 'role' column in your users table
-- 2. The developer role should be 'developer' (lowercase)
-- 3. Policies are now idempotent - safe to run multiple times
-- 4. To see existing policies: SELECT * FROM pg_policies WHERE tablename = 'your_table';
-- ============================================================================
