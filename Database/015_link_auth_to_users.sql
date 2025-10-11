-- ============================================================================
-- LINK AUTH USERS TO APP USERS (Run after testing with RLS disabled)
-- ============================================================================
-- This properly links Supabase auth.users to your public.users table

-- Step 1: Update your user record with auth_user_id
-- Replace 'your-auth-uuid' with your actual auth.users.id
UPDATE users 
SET auth_user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'voyagetechsolutions@gmail.com'
)
WHERE email = 'voyagetechsolutions@gmail.com';

-- Verify the link
SELECT 
    u.user_id,
    u.name,
    u.email,
    u.role,
    u.auth_user_id,
    au.id AS auth_id,
    au.email AS auth_email
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'voyagetechsolutions@gmail.com';

-- ============================================================================
-- Create BETTER RLS policies that use auth_user_id
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Developers can view all companies" ON companies;
DROP POLICY IF EXISTS "Developers can view all users" ON users;
DROP POLICY IF EXISTS "Developers can view all buses" ON buses;
DROP POLICY IF EXISTS "Developers can view all routes" ON routes;
DROP POLICY IF EXISTS "Developers can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Developers can view all payments" ON payments;
DROP POLICY IF EXISTS "Developers can view all activity logs" ON activity_log;

-- Create NEW policies using auth_user_id
CREATE POLICY "Developers can view all companies v2"
ON companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can view all users v2"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.auth_user_id = auth.uid()
    AND u.role = 'developer'
  )
);

CREATE POLICY "Developers can view all buses v2"
ON buses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can view all routes v2"
ON routes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can view all bookings v2"
ON bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can view all payments v2"
ON payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can view all activity logs v2"
ON activity_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

SELECT '✅ New RLS policies created using auth_user_id' AS status;
SELECT 'Now re-enable RLS' AS next_step;

-- ============================================================================
-- Re-enable RLS
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

SELECT '✅ RLS re-enabled with proper auth linking' AS status;
SELECT 'Refresh dashboard - it should work now!' AS result;
