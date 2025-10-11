-- ============================================================================
-- GET SPECIFIC TABLE COLUMNS - Only the tables we need for test data
-- ============================================================================

-- COMPANIES TABLE
SELECT '========== COMPANIES ==========' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'companies'
ORDER BY ordinal_position;

-- BUSES TABLE
SELECT '========== BUSES ==========' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'buses'
ORDER BY ordinal_position;

-- ROUTES TABLE
SELECT '========== ROUTES ==========' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'routes'
ORDER BY ordinal_position;

-- PAYMENTS TABLE
SELECT '========== PAYMENTS ==========' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- ACTIVITY_LOG TABLE
SELECT '========== ACTIVITY_LOG ==========' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'activity_log'
ORDER BY ordinal_position;

-- PLATFORM_SETTINGS TABLE
SELECT '========== PLATFORM_SETTINGS ==========' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'platform_settings'
ORDER BY ordinal_position;

SELECT '========================================' AS separator;
SELECT '✅ COPY ALL OUTPUT AND SHARE IT!' AS instruction;
