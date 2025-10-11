-- ============================================================================
-- CHECK DATABASE SCHEMA - Run this to see actual table structures
-- ============================================================================

-- Check companies table structure
SELECT 'COMPANIES TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'companies'
ORDER BY ordinal_position;

-- Check users table structure
SELECT 'USERS TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check buses table structure
SELECT 'BUSES TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'buses'
ORDER BY ordinal_position;

-- Check routes table structure
SELECT 'ROUTES TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'routes'
ORDER BY ordinal_position;

-- Check bookings table structure
SELECT 'BOOKINGS TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bookings'
ORDER BY ordinal_position;

-- Check payments table structure
SELECT 'PAYMENTS TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'payments'
ORDER BY ordinal_position;

-- Check activity_log table structure
SELECT 'ACTIVITY_LOG TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'activity_log'
ORDER BY ordinal_position;

-- Check announcements table structure
SELECT 'ANNOUNCEMENTS TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'announcements'
ORDER BY ordinal_position;

-- Check platform_settings table structure
SELECT 'PLATFORM_SETTINGS TABLE COLUMNS:' AS info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'platform_settings'
ORDER BY ordinal_position;

SELECT '✓ Schema check complete!' AS result;
SELECT 'Copy the output and share it so we can fix the INSERT statements.' AS note;
