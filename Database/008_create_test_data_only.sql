-- ============================================================================
-- CREATE TEST DATA ONLY (Simplified Version)
-- ============================================================================
-- This is a simplified version that just creates test data
-- Run this if 007 is giving you issues

-- ============================================================================
-- PART 1: CREATE TEST COMPANIES
-- ============================================================================
INSERT INTO companies (name, email, phone, address, subscription_plan, is_active, created_at)
VALUES
    ('ABC Transport Ltd', 'contact@abctransport.co.za', '+27 11 123 4567', '123 Main Road, Johannesburg', 'Premium', true, NOW()),
    ('XYZ Bus Services', 'info@xyzbus.co.za', '+27 21 987 6543', '456 Beach Road, Cape Town', 'Standard', true, NOW()),
    ('Quick Shuttle Co', 'hello@quickshuttle.co.za', '+27 31 555 1234', '789 Park Lane, Durban', 'Basic', true, NOW()),
    ('Metro Express', 'support@metroexpress.co.za', '+27 12 444 9876', '321 City Center, Pretoria', 'Premium', true, NOW()),
    ('Coastal Coaches', 'admin@coastalcoaches.co.za', '+27 41 333 5555', '654 Harbor View, Port Elizabeth', 'Standard', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- PART 2: CREATE TEST USERS
-- ============================================================================
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
    ('Tom Admin', 'tom.admin@coastalcoaches.co.za', 'admin', 'Coastal Coaches')
) AS v(name, email, role, company_name)
LEFT JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = v.email);

-- ============================================================================
-- PART 3: CREATE DEVELOPER USER (if not exists)
-- ============================================================================
INSERT INTO users (name, email, role, is_active, created_at)
VALUES ('Developer User', 'developer@vts.com', 'developer', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- PART 4: CREATE TEST BUSES
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
ON CONFLICT (registration_number) DO NOTHING;

-- ============================================================================
-- PART 5: CREATE TEST ROUTES
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
-- PART 6: CREATE TEST BOOKINGS
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
WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE passenger_email = v.passenger_email);

-- ============================================================================
-- PART 7: CREATE TEST PAYMENTS
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
AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.company_id = b.company_id 
    AND p.amount = b.amount 
    AND p.created_at::date = b.created_at::date
);

-- ============================================================================
-- PART 8: CREATE ACTIVITY LOGS
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
WHERE NOT EXISTS (SELECT 1 FROM activity_log WHERE message = v.message);

-- ============================================================================
-- PART 9: CREATE PLATFORM SETTINGS
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
-- VERIFY DATA WAS CREATED
-- ============================================================================
SELECT '✓ Test data creation complete!' AS status;

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
SELECT 
    (SELECT COUNT(*) FROM companies WHERE is_active = true) AS active_companies,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM buses) AS total_buses,
    (SELECT SUM(amount) FROM payments WHERE status = 'completed') AS total_revenue_rands;

SELECT '✓ Done! Check the counts above.' AS result;
