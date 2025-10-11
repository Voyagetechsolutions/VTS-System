-- ============================================================================
-- AUTO-DETECT SCHEMA - Shows column names in a readable format
-- ============================================================================

-- COMPANIES TABLE
SELECT '========================================' AS info;
SELECT '📋 COMPANIES TABLE COLUMNS:' AS info;
SELECT '========================================' AS info;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'companies'
ORDER BY ordinal_position;

-- USERS TABLE
SELECT '========================================' AS info;
SELECT '👤 USERS TABLE COLUMNS:' AS info;
SELECT '========================================' AS info;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- BUSES TABLE
SELECT '========================================' AS info;
SELECT '🚌 BUSES TABLE COLUMNS:' AS info;
SELECT '========================================' AS info;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'buses'
ORDER BY ordinal_position;

-- ROUTES TABLE
SELECT '========================================' AS info;
SELECT '🛣️ ROUTES TABLE COLUMNS:' AS info;
SELECT '========================================' AS info;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'routes'
ORDER BY ordinal_position;

-- BOOKINGS TABLE
SELECT '========================================' AS info;
SELECT '🎫 BOOKINGS TABLE COLUMNS:' AS info;
SELECT '========================================' AS info;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'bookings'
ORDER BY ordinal_position;

-- PAYMENTS TABLE
SELECT '========================================' AS info;
SELECT '💳 PAYMENTS TABLE COLUMNS:' AS info;
SELECT '========================================' AS info;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- ACTIVITY_LOG TABLE
SELECT '========================================' AS info;
SELECT '📊 ACTIVITY_LOG TABLE COLUMNS:' AS info;
SELECT '========================================' AS info;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'activity_log'
ORDER BY ordinal_position;

-- PLATFORM_SETTINGS TABLE
SELECT '========================================' AS info;
SELECT '⚙️ PLATFORM_SETTINGS TABLE COLUMNS:' AS info;
SELECT '========================================' AS info;
SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'platform_settings'
ORDER BY ordinal_position;

-- SUMMARY
SELECT '========================================' AS info;
SELECT '✅ SCHEMA DETECTION COMPLETE!' AS info;
SELECT '========================================' AS info;
SELECT 'Copy ALL the output above and share it' AS instruction;
SELECT 'We will create a custom script for YOUR schema' AS note;
