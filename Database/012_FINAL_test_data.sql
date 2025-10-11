-- ============================================================================
-- FINAL COMPLETE TEST DATA SCRIPT - Matches YOUR Exact Database Schema
-- ============================================================================
-- This script creates test data for the Developer Dashboard
-- All column names match your actual database structure

-- ============================================================================
-- PART 1: CREATE TEST COMPANIES
-- ============================================================================
-- Schema: company_id (uuid), name (text), subscription_plan (text), is_active (boolean), created_at (timestamp)

INSERT INTO companies (name, subscription_plan, is_active, created_at)
VALUES
    ('ABC Transport Ltd', 'Premium', true, NOW()),
    ('XYZ Bus Services', 'Standard', true, NOW()),
    ('Quick Shuttle Co', 'Basic', true, NOW()),
    ('Metro Express', 'Premium', true, NOW()),
    ('Coastal Coaches', 'Standard', true, NOW())
ON CONFLICT DO NOTHING;

SELECT '✅ Step 1: Companies created' AS status;
SELECT COUNT(*) AS company_count FROM companies WHERE name IN ('ABC Transport Ltd', 'XYZ Bus Services', 'Quick Shuttle Co', 'Metro Express', 'Coastal Coaches');

-- ============================================================================
-- PART 2: CREATE TEST USERS
-- ============================================================================
-- Schema: user_id (uuid), company_id (uuid), role (text), name (text), email (text), is_active (boolean), created_at (timestamp)

-- Create developer user (no company)
INSERT INTO users (name, email, role, is_active, created_at)
VALUES ('Developer User', 'developer@vts.com', 'developer', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- Create company users
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

SELECT '✅ Step 2: Users created' AS status;
SELECT COUNT(*) AS user_count FROM users WHERE role IN ('developer', 'admin', 'ops_manager', 'driver', 'booking_officer');

-- ============================================================================
-- PART 3: CREATE TEST BUSES
-- ============================================================================
-- Schema: bus_id (uuid), company_id (uuid), license_plate (text), capacity (int), 
-- status (text), model (text), make (text), created_at (timestamp)

INSERT INTO buses (license_plate, model, make, capacity, status, company_id, created_at)
SELECT 
    v.license_plate,
    v.model,
    v.make,
    v.capacity,
    v.status,
    c.company_id,
    NOW()
FROM (VALUES
    ('ABC-123-GP', 'Sprinter', 'Mercedes', 22, 'active', 'ABC Transport Ltd'),
    ('ABC-456-GP', 'Daily', 'Iveco', 18, 'active', 'ABC Transport Ltd'),
    ('XYZ-789-WC', 'Quantum', 'Toyota', 14, 'active', 'XYZ Bus Services'),
    ('XYZ-321-WC', 'Crafter', 'VW', 16, 'maintenance', 'XYZ Bus Services'),
    ('QSC-111-KZN', 'Sprinter', 'Mercedes', 20, 'active', 'Quick Shuttle Co'),
    ('MEX-222-GP', 'Daily', 'Iveco', 18, 'active', 'Metro Express'),
    ('MEX-333-GP', 'Sprinter', 'Mercedes', 22, 'active', 'Metro Express'),
    ('CC-444-EC', 'Quantum', 'Toyota', 14, 'active', 'Coastal Coaches')
) AS v(license_plate, model, make, capacity, status, company_name)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM buses WHERE license_plate = v.license_plate);

SELECT '✅ Step 3: Buses created' AS status;
SELECT COUNT(*) AS bus_count FROM buses;

-- ============================================================================
-- PART 4: CREATE TEST ROUTES
-- ============================================================================
-- Schema: route_id (uuid), company_id (uuid), origin (text), destination (text), 
-- distance_km (numeric), price (numeric), status (text), created_at (timestamp)

INSERT INTO routes (origin, destination, distance_km, price, status, company_id, created_at)
SELECT 
    v.origin,
    v.destination,
    v.distance_km,
    v.price,
    'active',
    c.company_id,
    NOW()
FROM (VALUES
    ('Johannesburg', 'Pretoria', 55, 150.00, 'ABC Transport Ltd'),
    ('Cape Town', 'Stellenbosch', 50, 120.00, 'XYZ Bus Services'),
    ('Durban', 'Pietermaritzburg', 80, 100.00, 'Quick Shuttle Co'),
    ('Pretoria CBD', 'Pretoria CBD', 25, 80.00, 'Metro Express'),
    ('Port Elizabeth', 'Gqeberha', 15, 60.00, 'Coastal Coaches')
) AS v(origin, destination, distance_km, price, company_name)
JOIN companies c ON c.name = v.company_name
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = v.origin AND destination = v.destination AND company_id = c.company_id);

SELECT '✅ Step 4: Routes created' AS status;
SELECT COUNT(*) AS route_count FROM routes;

-- ============================================================================
-- PART 5: CREATE TEST BOOKINGS
-- ============================================================================
-- Schema: booking_id (uuid), passenger_name (text), contact_email (text), 
-- contact_phone (text), status (text), payment_status (text), booking_date (timestamp)

INSERT INTO bookings (passenger_name, contact_email, contact_phone, status, payment_status, booking_date)
SELECT * FROM (VALUES
    ('Peter Smith', 'peter@email.com', '+27 82 123 4567', 'Confirmed', 'paid', NOW()),
    ('Mary Johnson', 'mary@email.com', '+27 83 234 5678', 'Confirmed', 'paid', NOW()),
    ('David Brown', 'david@email.com', '+27 84 345 6789', 'Confirmed', 'paid', NOW()),
    ('Susan Wilson', 'susan@email.com', '+27 85 456 7890', 'Confirmed', 'paid', NOW() - INTERVAL '1 day'),
    ('James Davis', 'james@email.com', '+27 86 567 8901', 'Confirmed', 'paid', NOW() - INTERVAL '1 day'),
    ('Emma Taylor', 'emma@email.com', '+27 87 678 9012', 'Confirmed', 'paid', NOW() - INTERVAL '2 days'),
    ('Oliver White', 'oliver@email.com', '+27 88 789 0123', 'Pending', 'pending', NOW())
) AS v(passenger_name, contact_email, contact_phone, status, payment_status, booking_date)
WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE contact_email = v.contact_email);

SELECT '✅ Step 5: Bookings created' AS status;
SELECT COUNT(*) AS booking_count FROM bookings;

-- ============================================================================
-- PART 6: CREATE TEST PAYMENTS
-- ============================================================================
-- Schema: transaction_id (uuid), booking_id (uuid), amount (numeric), 
-- payment_method (text), status (text), paid_at (timestamp)

INSERT INTO payments (booking_id, amount, payment_method, status, paid_at)
SELECT 
    b.booking_id,
    CASE 
        WHEN b.contact_email = 'peter@email.com' THEN 150.00
        WHEN b.contact_email = 'mary@email.com' THEN 120.00
        WHEN b.contact_email = 'david@email.com' THEN 100.00
        WHEN b.contact_email = 'susan@email.com' THEN 180.00
        WHEN b.contact_email = 'james@email.com' THEN 140.00
        WHEN b.contact_email = 'emma@email.com' THEN 160.00
        ELSE 130.00
    END,
    'card',
    'completed',
    b.booking_date
FROM bookings b
WHERE b.payment_status = 'paid'
AND NOT EXISTS (SELECT 1 FROM payments WHERE booking_id = b.booking_id);

SELECT '✅ Step 6: Payments created' AS status;
SELECT COUNT(*) AS payment_count FROM payments;

-- ============================================================================
-- PART 7: CREATE ACTIVITY LOGS
-- ============================================================================
-- Schema: id (uuid), company_id (uuid), type (text), message (text), created_at (timestamp)

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

SELECT '✅ Step 7: Activity logs created' AS status;
SELECT COUNT(*) AS activity_count FROM activity_log;

-- ============================================================================
-- PART 8: CREATE ANNOUNCEMENTS
-- ============================================================================
-- Schema: id (uuid), title (text), message (text), created_at (timestamp)

INSERT INTO announcements (title, message, created_at)
SELECT * FROM (VALUES
    ('Welcome to VTS', 'Welcome to the VTS Bus Management System!', NOW()),
    ('System Maintenance', 'Scheduled maintenance on Sunday 2AM-4AM', NOW() - INTERVAL '1 day'),
    ('New Features', 'Check out our new booking features!', NOW() - INTERVAL '2 days')
) AS v(title, message, created_at)
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = v.title);

SELECT '✅ Step 8: Announcements created' AS status;
SELECT COUNT(*) AS announcement_count FROM announcements;

-- ============================================================================
-- PART 9: UPDATE PLATFORM SETTINGS
-- ============================================================================
-- Schema: id (int), address (text), contact (text), currency (text), timezone (text), updated_at (timestamp)

UPDATE platform_settings 
SET 
    address = 'VTS Headquarters, Johannesburg, South Africa',
    contact = 'support@vts.com',
    currency = 'ZAR',
    timezone = 'Africa/Johannesburg',
    updated_at = NOW()
WHERE id = 1;

SELECT '✅ Step 9: Platform settings updated' AS status;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
SELECT '========================================' AS separator;
SELECT '🎉 ALL TEST DATA CREATED SUCCESSFULLY!' AS result;
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
SELECT 'announcements', COUNT(*) FROM announcements;

-- Show expected dashboard metrics
SELECT '========================================' AS separator;
SELECT '📊 EXPECTED DEVELOPER DASHBOARD METRICS:' AS info;
SELECT '========================================' AS separator;

SELECT 
    (SELECT COUNT(*) FROM companies WHERE is_active = true) AS active_companies,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM buses) AS total_buses,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') AS total_revenue_rands;

SELECT '========================================' AS separator;
SELECT '🎯 NEXT STEP: Set your user as developer' AS instruction;
SELECT 'Run this SQL:' AS step;
SELECT 'UPDATE users SET role = ''developer'' WHERE email = ''your-email@example.com'';' AS sql_command;
SELECT '========================================' AS separator;
SELECT '✅ Then refresh your Developer Dashboard!' AS final_step;
