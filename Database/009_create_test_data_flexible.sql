-- ============================================================================
-- CREATE TEST DATA - FLEXIBLE VERSION
-- ============================================================================
-- This version uses only the most common columns that should exist
-- Run 000_check_schema.sql first to see your actual table structure

-- ============================================================================
-- PART 1: CREATE TEST COMPANIES (minimal columns)
-- ============================================================================
INSERT INTO companies (name, subscription_plan, is_active, created_at)
VALUES
    ('ABC Transport Ltd', 'Premium', true, NOW()),
    ('XYZ Bus Services', 'Standard', true, NOW()),
    ('Quick Shuttle Co', 'Basic', true, NOW()),
    ('Metro Express', 'Premium', true, NOW()),
    ('Coastal Coaches', 'Standard', true, NOW())
ON CONFLICT DO NOTHING;

SELECT '✓ Companies created' AS status;
SELECT COUNT(*) AS company_count FROM companies;

-- ============================================================================
-- PART 2: CREATE TEST USERS (minimal columns)
-- ============================================================================
-- First, let's create users without company_id to avoid foreign key issues
INSERT INTO users (name, email, role, is_active, created_at)
VALUES
    ('Developer User', 'developer@vts.com', 'developer', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- Now create company users
INSERT INTO users (name, email, role, company_id, is_active, created_at)
SELECT 
    v.name, 
    v.email, 
    v.role, 
    c.company_id, 
    true, 
    NOW()
FROM (VALUES
    ('John Admin', 'john.admin@abc.com', 'admin', 'ABC Transport Ltd'),
    ('Sarah Manager', 'sarah.manager@xyz.com', 'ops_manager', 'XYZ Bus Services'),
    ('Mike Driver', 'mike.driver@quick.com', 'driver', 'Quick Shuttle Co'),
    ('Lisa Booking', 'lisa.booking@metro.com', 'booking_officer', 'Metro Express'),
    ('Tom Admin', 'tom.admin@coastal.com', 'admin', 'Coastal Coaches')
) AS v(name, email, role, company_name)
LEFT JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = v.email);

SELECT '✓ Users created' AS status;
SELECT COUNT(*) AS user_count FROM users;

-- ============================================================================
-- PART 3: CREATE TEST BUSES (minimal columns)
-- ============================================================================
INSERT INTO buses (registration_number, model, capacity, company_id, created_at)
SELECT 
    v.registration_number,
    v.model,
    v.capacity,
    c.company_id,
    NOW()
FROM (VALUES
    ('ABC-123-GP', 'Mercedes Sprinter', 22, 'ABC Transport Ltd'),
    ('ABC-456-GP', 'Iveco Daily', 18, 'ABC Transport Ltd'),
    ('XYZ-789-WC', 'Toyota Quantum', 14, 'XYZ Bus Services'),
    ('XYZ-321-WC', 'VW Crafter', 16, 'XYZ Bus Services'),
    ('QSC-111-KZN', 'Mercedes Sprinter', 20, 'Quick Shuttle Co'),
    ('MEX-222-GP', 'Iveco Daily', 18, 'Metro Express'),
    ('MEX-333-GP', 'Mercedes Sprinter', 22, 'Metro Express'),
    ('CC-444-EC', 'Toyota Quantum', 14, 'Coastal Coaches')
) AS v(registration_number, model, capacity, company_name)
JOIN companies c ON c.name = v.company_name
ON CONFLICT (registration_number) DO NOTHING;

SELECT '✓ Buses created' AS status;
SELECT COUNT(*) AS bus_count FROM buses;

-- ============================================================================
-- PART 4: CREATE TEST ROUTES (minimal columns)
-- ============================================================================
INSERT INTO routes (name, origin, destination, company_id, created_at)
SELECT 
    v.name,
    v.origin,
    v.destination,
    c.company_id,
    NOW()
FROM (VALUES
    ('JHB to PTA Express', 'Johannesburg', 'Pretoria', 'ABC Transport Ltd'),
    ('CPT to Stellenbosch', 'Cape Town', 'Stellenbosch', 'XYZ Bus Services'),
    ('DBN to PMB', 'Durban', 'Pietermaritzburg', 'Quick Shuttle Co'),
    ('PTA City Loop', 'Pretoria CBD', 'Pretoria CBD', 'Metro Express'),
    ('PE to Gqeberha', 'Port Elizabeth', 'Gqeberha', 'Coastal Coaches')
) AS v(name, origin, destination, company_name)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE name = v.name);

SELECT '✓ Routes created' AS status;
SELECT COUNT(*) AS route_count FROM routes;

-- ============================================================================
-- PART 5: CREATE TEST BOOKINGS (minimal columns)
-- ============================================================================
INSERT INTO bookings (passenger_name, passenger_email, amount, booking_date, company_id, created_at)
SELECT 
    v.passenger_name,
    v.passenger_email,
    v.amount,
    v.booking_date,
    c.company_id,
    NOW()
FROM (VALUES
    ('Peter Smith', 'peter@email.com', 150.00, CURRENT_DATE, 'ABC Transport Ltd'),
    ('Mary Johnson', 'mary@email.com', 120.00, CURRENT_DATE, 'XYZ Bus Services'),
    ('David Brown', 'david@email.com', 100.00, CURRENT_DATE, 'Quick Shuttle Co'),
    ('Susan Wilson', 'susan@email.com', 180.00, CURRENT_DATE - 1, 'Metro Express'),
    ('James Davis', 'james@email.com', 140.00, CURRENT_DATE - 1, 'Coastal Coaches'),
    ('Emma Taylor', 'emma@email.com', 160.00, CURRENT_DATE - 2, 'ABC Transport Ltd'),
    ('Oliver White', 'oliver@email.com', 130.00, CURRENT_DATE, 'XYZ Bus Services')
) AS v(passenger_name, passenger_email, amount, booking_date, company_name)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE passenger_email = v.passenger_email);

SELECT '✓ Bookings created' AS status;
SELECT COUNT(*) AS booking_count FROM bookings;

-- ============================================================================
-- PART 6: CREATE TEST PAYMENTS (minimal columns)
-- ============================================================================
INSERT INTO payments (amount, payment_method, company_id, created_at)
SELECT 
    b.amount,
    'card',
    b.company_id,
    b.created_at
FROM bookings b
WHERE NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.company_id = b.company_id 
    AND p.amount = b.amount 
    AND p.created_at::date = b.created_at::date
)
LIMIT 6;

SELECT '✓ Payments created' AS status;
SELECT COUNT(*) AS payment_count FROM payments;

-- ============================================================================
-- PART 7: CREATE ACTIVITY LOGS (minimal columns)
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
    ('user_login', 'User john.admin logged in', 'ABC Transport Ltd', 3),
    ('booking_created', 'New booking created for CPT to Stellenbosch', 'XYZ Bus Services', 4),
    ('payment_completed', 'Payment of R150 completed', 'ABC Transport Ltd', 5),
    ('route_created', 'New route added: JHB to PTA Express', 'ABC Transport Ltd', 6),
    ('bus_maintenance', 'Bus XYZ-321-WC scheduled for maintenance', 'XYZ Bus Services', 7),
    ('user_created', 'New user added: Sarah Manager', 'XYZ Bus Services', 8),
    ('booking_confirmed', 'Booking confirmed for passenger Peter Smith', 'ABC Transport Ltd', 9),
    ('payment_completed', 'Payment of R120 completed', 'XYZ Bus Services', 10)
) AS v(type, message, company_name, hours_ago)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM activity_log WHERE message = v.message);

SELECT '✓ Activity logs created' AS status;
SELECT COUNT(*) AS activity_count FROM activity_log;

-- ============================================================================
-- PART 8: CREATE PLATFORM SETTINGS
-- ============================================================================
INSERT INTO platform_settings (key, value, created_at)
VALUES
    ('platformName', 'VTS Bus Management System', NOW()),
    ('defaultTimezone', 'Africa/Johannesburg', NOW()),
    ('defaultCurrency', 'ZAR', NOW()),
    ('defaultLanguage', 'en', NOW()),
    ('defaultPlan', 'Basic', NOW())
ON CONFLICT (key) DO NOTHING;

SELECT '✓ Platform settings created' AS status;
SELECT COUNT(*) AS settings_count FROM platform_settings;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
SELECT '========================================' AS separator;
SELECT '✓ ALL TEST DATA CREATED SUCCESSFULLY!' AS result;
SELECT '========================================' AS separator;

SELECT 
    'companies' AS table_name,
    COUNT(*) AS total_count
FROM companies
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'buses', COUNT(*) FROM buses
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log
UNION ALL
SELECT 'platform_settings', COUNT(*) FROM platform_settings;

-- Show expected dashboard metrics
SELECT '========================================' AS separator;
SELECT 'EXPECTED DEVELOPER DASHBOARD METRICS:' AS info;
SELECT '========================================' AS separator;

SELECT 
    (SELECT COUNT(*) FROM companies WHERE is_active = true) AS active_companies,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM buses) AS total_buses,
    (SELECT COALESCE(SUM(amount), 0) FROM payments) AS total_revenue_rands;

SELECT '========================================' AS separator;
SELECT 'Now set your user as developer:' AS next_step;
SELECT 'UPDATE users SET role = ''developer'' WHERE email = ''your-email@example.com'';' AS sql_command;
SELECT '========================================' AS separator;
