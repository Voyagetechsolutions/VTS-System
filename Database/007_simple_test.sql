-- ============================================================================
-- SIMPLE DATABASE TEST - Run this first to verify connection
-- ============================================================================

-- Test 1: Check if tables exist
SELECT 'Test 1: Checking tables...' AS test;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Test 2: Count existing data
SELECT 'Test 2: Current data counts...' AS test;
SELECT 'companies' AS table_name, COUNT(*) AS count FROM companies
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'buses', COUNT(*) FROM buses
UNION ALL SELECT 'routes', COUNT(*) FROM routes
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'activity_log', COUNT(*) FROM activity_log
UNION ALL SELECT 'announcements', COUNT(*) FROM announcements;

-- Test 3: Check if you have developer role
SELECT 'Test 3: Checking your user role...' AS test;
SELECT user_id, name, email, role FROM users WHERE role = 'developer';

-- Test 4: Simple insert test (companies)
SELECT 'Test 4: Testing insert capability...' AS test;
INSERT INTO companies (name, email, phone, address, subscription_plan, is_active, created_at)
VALUES ('Test Company', 'test@test.com', '+27 11 111 1111', 'Test Address', 'Basic', true, NOW())
ON CONFLICT DO NOTHING;

-- Test 5: Verify insert worked
SELECT 'Test 5: Verifying insert...' AS test;
SELECT name, email, subscription_plan FROM companies WHERE email = 'test@test.com';

SELECT '✓ All tests complete!' AS result;
