-- ============================================================================
-- DIAGNOSTIC SCRIPT - Check if data exists and RLS is blocking
-- ============================================================================

-- 1. Check if test data was created
SELECT '========== DATA CHECK ==========' AS info;
SELECT 'companies' AS table_name, COUNT(*) AS count FROM companies
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'buses', COUNT(*) FROM buses
UNION ALL SELECT 'routes', COUNT(*) FROM routes
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'activity_log', COUNT(*) FROM activity_log
UNION ALL SELECT 'announcements', COUNT(*) FROM announcements;

-- 2. Check if RLS is enabled
SELECT '========== RLS STATUS ==========' AS info;
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('companies', 'users', 'buses', 'routes', 'bookings', 'payments', 'activity_log')
ORDER BY tablename;

-- 3. Check if developer policies exist
SELECT '========== DEVELOPER POLICIES ==========' AS info;
SELECT 
    tablename,
    policyname,
    cmd AS operation
FROM pg_policies
WHERE policyname ILIKE '%developer%'
ORDER BY tablename, policyname;

-- 4. Check your user role
SELECT '========== YOUR USER ROLE ==========' AS info;
SELECT user_id, name, email, role, is_active
FROM users
WHERE role = 'developer' OR email ILIKE '%@vts.com';

-- 5. Test a simple query (as if from frontend)
SELECT '========== TEST QUERY ==========' AS info;
SELECT COUNT(*) AS company_count FROM companies WHERE is_active = true;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS bus_count FROM buses;

SELECT '========================================' AS separator;
SELECT '✅ Diagnostic complete!' AS result;
SELECT 'If counts are 0, RLS is blocking access' AS note;
SELECT 'If no developer policies found, run 006_developer_rls_policies.sql' AS fix;
