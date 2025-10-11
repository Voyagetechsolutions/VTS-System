-- ============================================================================
-- GET REMAINING TABLE SCHEMAS
-- ============================================================================
-- Run this to get the schemas for the tables we still need

-- COMPANIES TABLE
SELECT '========================================' AS info;
SELECT '🏢 COMPANIES TABLE:' AS info;
SELECT '========================================' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'companies'
ORDER BY ordinal_position;

-- BUSES TABLE
SELECT '========================================' AS info;
SELECT '🚌 BUSES TABLE:' AS info;
SELECT '========================================' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'buses'
ORDER BY ordinal_position;

-- ROUTES TABLE
SELECT '========================================' AS info;
SELECT '🛣️ ROUTES TABLE:' AS info;
SELECT '========================================' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'routes'
ORDER BY ordinal_position;

-- PAYMENTS TABLE
SELECT '========================================' AS info;
SELECT '💳 PAYMENTS TABLE:' AS info;
SELECT '========================================' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- ACTIVITY_LOG TABLE
SELECT '========================================' AS info;
SELECT '📊 ACTIVITY_LOG TABLE:' AS info;
SELECT '========================================' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'activity_log'
ORDER BY ordinal_position;

-- PLATFORM_SETTINGS TABLE
SELECT '========================================' AS info;
SELECT '⚙️ PLATFORM_SETTINGS TABLE:' AS info;
SELECT '========================================' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'platform_settings'
ORDER BY ordinal_position;

SELECT '========================================' AS info;
SELECT '✅ Copy ALL output above and share it!' AS instruction;
