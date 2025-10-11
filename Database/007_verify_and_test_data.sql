-- ============================================================================
-- DEVELOPER DASHBOARD DATABASE VERIFICATION & TEST DATA
-- ============================================================================
-- This script verifies the database structure and creates test data
-- Run this in Supabase SQL Editor to verify everything is connected

-- ============================================================================
-- PART 1: VERIFY TABLES EXIST
-- ============================================================================
SELECT 'Checking if all required tables exist...' AS status;

SELECT 
    tablename,
    CASE 
        WHEN tablename IN (
            'companies', 'users', 'buses', 'routes', 'bookings', 'payments',
            'activity_log', 'announcements', 'platform_settings', 'subscriptions'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'companies', 'users', 'buses', 'routes', 'bookings', 'payments',
    'activity_log', 'announcements', 'platform_settings', 'subscriptions'
)
ORDER BY tablename;

-- ============================================================================
-- PART 2: CHECK CURRENT DATA COUNTS
-- ============================================================================
SELECT 'Current data counts in database...' AS status;

SELECT 
    'companies' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE is_active = true) AS active_count
FROM companies
UNION ALL
SELECT 
    'users' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE is_active = true) AS active_count
FROM users
UNION ALL
SELECT 
    'buses' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE status = 'active') AS active_count
FROM buses
UNION ALL
SELECT 
    'routes' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) AS active_count
FROM routes
UNION ALL
SELECT 
    'bookings' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) AS active_count
FROM bookings
UNION ALL
SELECT 
    'payments' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
FROM payments
UNION ALL
SELECT 
    'activity_log' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) AS active_count
FROM activity_log
UNION ALL
SELECT 
    'announcements' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE status = 'sent') AS sent_count
FROM announcements;

-- ============================================================================
-- PART 3: CREATE TEST COMPANIES (if none exist)
-- ============================================================================
INSERT INTO companies (name, email, phone, address, subscription_plan, is_active, created_at)
SELECT * FROM (VALUES
    ('ABC Transport Ltd', 'contact@abctransport.co.za', '+27 11 123 4567', '123 Main Road, Johannesburg', 'Premium', true, NOW()),
    ('XYZ Bus Services', 'info@xyzbus.co.za', '+27 21 987 6543', '456 Beach Road, Cape Town', 'Standard', true, NOW()),
    ('Quick Shuttle Co', 'hello@quickshuttle.co.za', '+27 31 555 1234', '789 Park Lane, Durban', 'Basic', true, NOW()),
    ('Metro Express', 'support@metroexpress.co.za', '+27 12 444 9876', '321 City Center, Pretoria', 'Premium', true, NOW()),
    ('Coastal Coaches', 'admin@coastalcoaches.co.za', '+27 41 333 5555', '654 Harbor View, Port Elizabeth', 'Standard', true, NOW())
) AS v(name, email, phone, address, subscription_plan, is_active, created_at)
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

-- ============================================================================
-- PART 4: CREATE TEST USERS (if none exist)
-- ============================================================================
-- Note: You'll need to create auth users separately in Supabase Auth
-- This creates the user records in the users table
INSERT INTO users (name, email, role, company_id, is_active, created_at)
SELECT 
    v.name, 
    v.email, 
    v.role, 
    c.company_id, 
    true, 
    NOW()
FROM (VALUES
    ('John Admin', 'john.admin@abctransport.co.za', 'admin', 'ABC Transport Ltd'),
    ('Sarah Manager', 'sarah.manager@xyzbus.co.za', 'ops_manager', 'XYZ Bus Services'),
    ('Mike Driver', 'mike.driver@quickshuttle.co.za', 'driver', 'Quick Shuttle Co'),
    ('Lisa Booking', 'lisa.booking@metroexpress.co.za', 'booking_officer', 'Metro Express'),
    ('Tom Admin', 'tom.admin@coastalcoaches.co.za', 'admin', 'Coastal Coaches'),
    ('Developer User', 'developer@vts.com', 'developer', NULL)
) AS v(name, email, role, company_name)
LEFT JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = v.email);

-- ============================================================================
-- PART 5: CREATE TEST BUSES (if none exist)
-- ============================================================================
INSERT INTO buses (registration_number, model, capacity, status, company_id, created_at)
SELECT 
    v.registration_number,
    v.model,
    v.capacity,
    v.status,
    c.company_id,
    NOW()
FROM (VALUES
    ('ABC-123-GP', 'Mercedes Sprinter', 22, 'active', 'ABC Transport Ltd'),
    ('ABC-456-GP', 'Iveco Daily', 18, 'active', 'ABC Transport Ltd'),
    ('XYZ-789-WC', 'Toyota Quantum', 14, 'active', 'XYZ Bus Services'),
    ('XYZ-321-WC', 'VW Crafter', 16, 'maintenance', 'XYZ Bus Services'),
    ('QSC-111-KZN', 'Mercedes Sprinter', 20, 'active', 'Quick Shuttle Co'),
    ('MEX-222-GP', 'Iveco Daily', 18, 'active', 'Metro Express'),
    ('MEX-333-GP', 'Mercedes Sprinter', 22, 'active', 'Metro Express'),
    ('CC-444-EC', 'Toyota Quantum', 14, 'active', 'Coastal Coaches')
) AS v(registration_number, model, capacity, status, company_name)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM buses WHERE registration_number = v.registration_number);

-- ============================================================================
-- PART 6: CREATE TEST ROUTES (if none exist)
-- ============================================================================
INSERT INTO routes (name, origin, destination, distance_km, duration_minutes, company_id, created_at)
SELECT 
    v.name,
    v.origin,
    v.destination,
    v.distance_km,
    v.duration_minutes,
    c.company_id,
    NOW()
FROM (VALUES
    ('JHB to PTA Express', 'Johannesburg', 'Pretoria', 55, 60, 'ABC Transport Ltd'),
    ('CPT to Stellenbosch', 'Cape Town', 'Stellenbosch', 50, 45, 'XYZ Bus Services'),
    ('DBN to PMB', 'Durban', 'Pietermaritzburg', 80, 90, 'Quick Shuttle Co'),
    ('PTA City Loop', 'Pretoria CBD', 'Pretoria CBD', 25, 30, 'Metro Express'),
    ('PE to Gqeberha', 'Port Elizabeth', 'Gqeberha', 15, 20, 'Coastal Coaches')
) AS v(name, origin, destination, distance_km, duration_minutes, company_name)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE name = v.name);

-- ============================================================================
-- PART 7: CREATE TEST BOOKINGS (if none exist)
-- ============================================================================
INSERT INTO bookings (booking_reference, passenger_name, passenger_email, passenger_phone, amount, status, booking_date, company_id, created_at)
SELECT 
    'BK' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
    v.passenger_name,
    v.passenger_email,
    v.passenger_phone,
    v.amount,
    v.status,
    v.booking_date,
    c.company_id,
    NOW()
FROM (VALUES
    ('Peter Smith', 'peter@email.com', '+27 82 123 4567', 150.00, 'confirmed', CURRENT_DATE, 'ABC Transport Ltd'),
    ('Mary Johnson', 'mary@email.com', '+27 83 234 5678', 120.00, 'confirmed', CURRENT_DATE, 'XYZ Bus Services'),
    ('David Brown', 'david@email.com', '+27 84 345 6789', 100.00, 'confirmed', CURRENT_DATE, 'Quick Shuttle Co'),
    ('Susan Wilson', 'susan@email.com', '+27 85 456 7890', 180.00, 'confirmed', CURRENT_DATE - 1, 'Metro Express'),
    ('James Davis', 'james@email.com', '+27 86 567 8901', 140.00, 'confirmed', CURRENT_DATE - 1, 'Coastal Coaches'),
    ('Emma Taylor', 'emma@email.com', '+27 87 678 9012', 160.00, 'confirmed', CURRENT_DATE - 2, 'ABC Transport Ltd'),
    ('Oliver White', 'oliver@email.com', '+27 88 789 0123', 130.00, 'pending', CURRENT_DATE, 'XYZ Bus Services')
) AS v(passenger_name, passenger_email, passenger_phone, amount, status, booking_date, company_name)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM bookings LIMIT 1);

-- ============================================================================
-- PART 8: CREATE TEST PAYMENTS (if none exist)
-- ============================================================================
INSERT INTO payments (amount, status, payment_method, company_id, created_at)
SELECT 
    b.amount,
    'completed',
    'card',
    b.company_id,
    b.created_at
FROM bookings b
WHERE b.status = 'confirmed'
AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = b.company_id AND amount = b.amount);

-- ============================================================================
-- PART 9: CREATE TEST ACTIVITY LOGS
-- ============================================================================
INSERT INTO activity_log (type, message, company_id, created_at)
SELECT 
    v.type,
    v.message,
    c.company_id,
    NOW() - (v.hours_ago || ' hours')::INTERVAL
FROM (VALUES
    ('booking_created', 'New booking created for JHB to PTA route', 'ABC Transport Ltd', 1),
    ('bus_added', 'New bus ABC-123-GP added to fleet', 'ABC Transport Ltd', 2),
    ('user_login', 'User john.admin@abctransport.co.za logged in', 'ABC Transport Ltd', 3),
    ('booking_created', 'New booking created for CPT to Stellenbosch', 'XYZ Bus Services', 4),
    ('payment_completed', 'Payment of R150 completed', 'ABC Transport Ltd', 5),
    ('route_created', 'New route added: JHB to PTA Express', 'ABC Transport Ltd', 6),
    ('bus_maintenance', 'Bus XYZ-321-WC scheduled for maintenance', 'XYZ Bus Services', 7),
    ('user_created', 'New user added: Sarah Manager', 'XYZ Bus Services', 8),
    ('booking_confirmed', 'Booking confirmed for passenger Peter Smith', 'ABC Transport Ltd', 9),
    ('payment_completed', 'Payment of R120 completed', 'XYZ Bus Services', 10)
) AS v(type, message, company_name, hours_ago)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM activity_log LIMIT 1);

-- ============================================================================
-- PART 10: CREATE PLATFORM SETTINGS (if not exist)
-- ============================================================================
INSERT INTO platform_settings (key, value, created_at)
VALUES
    ('platformName', 'VTS Bus Management System', NOW()),
    ('defaultTimezone', 'Africa/Johannesburg', NOW()),
    ('defaultCurrency', 'ZAR', NOW()),
    ('defaultLanguage', 'en', NOW()),
    ('defaultPlan', 'Basic', NOW()),
    ('defaultTrialPeriod', '30', NOW()),
    ('maxUsersPerCompany', '100', NOW()),
    ('maxBusesPerCompany', '50', NOW()),
    ('commissionPercentage', '5', NOW()),
    ('emailNotifications', 'true', NOW()),
    ('smsNotifications', 'false', NOW()),
    ('passwordMinLength', '8', NOW()),
    ('passwordComplexity', 'true', NOW()),
    ('twoFactorRequired', 'false', NOW()),
    ('sessionTimeout', '480', NOW()),
    ('logRetentionPeriod', '365', NOW()),
    ('detailedLogging', 'true', NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PART 11: VERIFY DATA WAS CREATED
-- ============================================================================
SELECT 'Final data counts after test data creation...' AS status;

SELECT 
    'companies' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE is_active = true) AS active_count
FROM companies
UNION ALL
SELECT 
    'users' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE is_active = true) AS active_count
FROM users
UNION ALL
SELECT 
    'buses' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE status = 'active') AS active_count
FROM buses
UNION ALL
SELECT 
    'routes' AS table_name,
    COUNT(*) AS total_count,
    NULL AS active_count
FROM routes
UNION ALL
SELECT 
    'bookings' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_count
FROM bookings
UNION ALL
SELECT 
    'payments' AS table_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
FROM payments
UNION ALL
SELECT 
    'activity_log' AS table_name,
    COUNT(*) AS total_count,
    NULL AS active_count
FROM activity_log;

-- ============================================================================
-- PART 12: CALCULATE METRICS (What Developer Dashboard Should Show)
-- ============================================================================
SELECT 'Expected Developer Dashboard Metrics:' AS status;

SELECT 
    (SELECT COUNT(*) FROM companies WHERE is_active = true) AS active_companies,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM buses) AS total_buses,
    (SELECT SUM(amount) FROM payments WHERE status = 'completed') AS total_revenue,
    (SELECT COUNT(*) FROM bookings WHERE booking_date >= CURRENT_DATE) AS bookings_today,
    (SELECT COUNT(*) FROM activity_log) AS total_activity_logs;

-- ============================================================================
-- PART 13: CHECK RLS POLICIES FOR DEVELOPER ROLE
-- ============================================================================
SELECT 'Checking RLS policies for developer access...' AS status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('companies', 'users', 'buses', 'activity_log', 'bookings', 'payments')
AND policyname ILIKE '%developer%'
ORDER BY tablename, policyname;

-- ============================================================================
-- PART 14: VERIFY DEVELOPER USER EXISTS
-- ============================================================================
SELECT 'Checking if developer user exists...' AS status;

SELECT 
    user_id,
    name,
    email,
    role,
    is_active,
    created_at
FROM users
WHERE role = 'developer';

-- If no developer user exists, you need to create one:
-- UPDATE users SET role = 'developer' WHERE email = 'your-email@example.com';

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT '✓ Verification complete! Check the results above.' AS status;
SELECT 'If you see 0 counts, the INSERT statements may have been skipped.' AS note;
SELECT 'Run this script again or manually insert test data.' AS note2;
