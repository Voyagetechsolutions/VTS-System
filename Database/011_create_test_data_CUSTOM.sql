-- ============================================================================
-- CREATE TEST DATA - CUSTOM FOR YOUR SCHEMA
-- ============================================================================
-- This script is tailored to YOUR actual database schema
-- Based on the schema detection output you provided

-- ============================================================================
-- PART 1: CREATE TEST COMPANIES
-- ============================================================================
-- Note: We need to see the companies table schema, but assuming it has:
-- company_id (uuid), name (text), created_at (timestamp)
INSERT INTO companies (name, created_at)
VALUES
    ('ABC Transport Ltd', NOW()),
    ('XYZ Bus Services', NOW()),
    ('Quick Shuttle Co', NOW()),
    ('Metro Express', NOW()),
    ('Coastal Coaches', NOW())
ON CONFLICT DO NOTHING;

SELECT '✓ Step 1: Companies created' AS status;
SELECT COUNT(*) AS company_count FROM companies;

-- ============================================================================
-- PART 2: CREATE TEST USERS
-- ============================================================================
-- Your users table has: user_id, company_id, role, name, email, password_hash, 
-- created_at, is_active, isactive, auth_user_id, branch_id, department

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

SELECT '✓ Step 2: Users created' AS status;
SELECT COUNT(*) AS user_count FROM users;

-- ============================================================================
-- PART 3: CREATE TEST BUSES
-- ============================================================================
-- Note: We need to see buses table schema
-- Assuming it has: bus_id, company_id, created_at and possibly license_plate or plate_number
-- We'll skip buses for now until we see the schema

SELECT '⚠ Step 3: Buses skipped (need schema)' AS status;
SELECT 'Run schema checker on buses table' AS note;

-- ============================================================================
-- PART 4: CREATE TEST ROUTES
-- ============================================================================
-- Note: We need to see routes table schema
-- Assuming it has: route_id, company_id, origin, destination, created_at
-- We'll skip routes for now until we see the schema

SELECT '⚠ Step 4: Routes skipped (need schema)' AS status;
SELECT 'Run schema checker on routes table' AS note;

-- ============================================================================
-- PART 5: CREATE TEST BOOKINGS
-- ============================================================================
-- Your bookings table has: booking_id, trip_id, passenger_name, seat_number,
-- booking_date, payment_status, booking_source, cancellation_reason, customer_id,
-- status, ticket_code, boarded_at, nationality, id_passport, origin_stop,
-- destination_stop, created_by_agent_id, route_id, bus_id, departure, arrival,
-- ticket_type, ticket_issue_date, discount, contact_phone, contact_email, branch_id

INSERT INTO bookings (
    passenger_name, 
    contact_email, 
    contact_phone,
    status,
    booking_date,
    payment_status
)
VALUES
    ('Peter Smith', 'peter@email.com', '+27 82 123 4567', 'Confirmed', NOW(), 'paid'),
    ('Mary Johnson', 'mary@email.com', '+27 83 234 5678', 'Confirmed', NOW(), 'paid'),
    ('David Brown', 'david@email.com', '+27 84 345 6789', 'Confirmed', NOW(), 'paid'),
    ('Susan Wilson', 'susan@email.com', '+27 85 456 7890', 'Confirmed', NOW() - INTERVAL '1 day', 'paid'),
    ('James Davis', 'james@email.com', '+27 86 567 8901', 'Confirmed', NOW() - INTERVAL '1 day', 'paid'),
    ('Emma Taylor', 'emma@email.com', '+27 87 678 9012', 'Confirmed', NOW() - INTERVAL '2 days', 'paid'),
    ('Oliver White', 'oliver@email.com', '+27 88 789 0123', 'Pending', NOW(), 'pending')
ON CONFLICT DO NOTHING;

SELECT '✓ Step 5: Bookings created' AS status;
SELECT COUNT(*) AS booking_count FROM bookings;

-- ============================================================================
-- PART 6: CREATE TEST PAYMENTS
-- ============================================================================
-- Note: We need to see payments table schema
-- Your payments table likely has: payment_id, booking_id, amount, created_at
-- NOT company_id as we tried before

SELECT '⚠ Step 6: Payments skipped (need schema)' AS status;
SELECT 'Run schema checker on payments table' AS note;

-- ============================================================================
-- PART 7: CREATE ACTIVITY LOGS
-- ============================================================================
-- Note: We need to see activity_log table schema

SELECT '⚠ Step 7: Activity logs skipped (need schema)' AS status;
SELECT 'Run schema checker on activity_log table' AS note;

-- ============================================================================
-- PART 8: CREATE ANNOUNCEMENTS
-- ============================================================================
-- Your announcements table has: id, title, message, created_at

INSERT INTO announcements (title, message, created_at)
VALUES
    ('Welcome to VTS', 'Welcome to the VTS Bus Management System!', NOW()),
    ('System Maintenance', 'Scheduled maintenance on Sunday 2AM-4AM', NOW() - INTERVAL '1 day'),
    ('New Features', 'Check out our new booking features!', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

SELECT '✓ Step 8: Announcements created' AS status;
SELECT COUNT(*) AS announcement_count FROM announcements;

-- ============================================================================
-- PART 9: CREATE PLATFORM SETTINGS
-- ============================================================================
-- Note: We need to see platform_settings table schema
-- It doesn't have a 'key' column, so we need to see what it actually has

SELECT '⚠ Step 9: Platform settings skipped (need schema)' AS status;
SELECT 'Run schema checker on platform_settings table' AS note;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
SELECT '========================================' AS separator;
SELECT '✓ PARTIAL TEST DATA CREATED!' AS result;
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

-- Show what we created
SELECT '========================================' AS separator;
SELECT 'SUCCESSFULLY CREATED:' AS info;
SELECT '✓ Companies: 5' AS created;
SELECT '✓ Users: 6' AS created;
SELECT '✓ Bookings: 7' AS created;
SELECT '✓ Announcements: 3' AS created;
SELECT '========================================' AS separator;

SELECT 'STILL NEED SCHEMA FOR:' AS info;
SELECT '⚠ buses table' AS needed;
SELECT '⚠ routes table' AS needed;
SELECT '⚠ payments table' AS needed;
SELECT '⚠ activity_log table' AS needed;
SELECT '⚠ platform_settings table' AS needed;
SELECT '========================================' AS separator;

SELECT 'NEXT STEPS:' AS info;
SELECT '1. Set your user as developer:' AS step;
SELECT '   UPDATE users SET role = ''developer'' WHERE email = ''your-email@example.com'';' AS sql;
SELECT '2. Share schema for remaining tables' AS step;
SELECT '3. We will create complete test data' AS step;
SELECT '========================================' AS separator;
