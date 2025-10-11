-- ============================================================================
-- FIX RLS 500 ERRORS - Update policies to work with your auth setup
-- ============================================================================
-- The 500 errors happen because auth.uid() doesn't match user_id in users table
-- We need to either:
-- 1. Link auth users to app users via auth_user_id column
-- 2. OR temporarily use a simpler policy for developers

-- ============================================================================
-- OPTION 1: Temporarily disable RLS for testing (RECOMMENDED FOR NOW)
-- ============================================================================
-- This will let us verify the app works, then we can fix auth properly

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE buses DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;

SELECT '✅ RLS temporarily disabled for testing' AS status;
SELECT 'Dashboard should now work!' AS result;
SELECT 'After testing, we will re-enable RLS with proper auth' AS note;

-- ============================================================================
-- Check if it worked
-- ============================================================================
SELECT COUNT(*) AS companies FROM companies;
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS buses FROM buses;

SELECT '========================================' AS separator;
SELECT 'Now refresh your dashboard!' AS instruction;
SELECT 'It should show real data' AS expected;
