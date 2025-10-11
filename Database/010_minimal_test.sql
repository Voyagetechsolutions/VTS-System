-- ============================================================================
-- ULTRA MINIMAL TEST - Only uses company_id, created_at, and basic fields
-- ============================================================================

-- Test 1: Create companies (only name and required fields)
INSERT INTO companies (name, created_at)
VALUES
    ('ABC Transport Ltd', NOW()),
    ('XYZ Bus Services', NOW()),
    ('Quick Shuttle Co', NOW())
ON CONFLICT DO NOTHING;

SELECT 'Companies created:' AS status, COUNT(*) AS count FROM companies;

-- Test 2: Create users (only name, email, role)
INSERT INTO users (name, email, role, created_at)
VALUES
    ('Developer User', 'dev@vts.com', 'developer', NOW()),
    ('Test Admin', 'admin@test.com', 'admin', NOW())
ON CONFLICT (email) DO NOTHING;

SELECT 'Users created:' AS status, COUNT(*) AS count FROM users;

-- Test 3: Try to create a bus (we'll guess at column names)
-- If this fails, we need the schema checker output
DO $$
BEGIN
    -- Try common column name variations
    BEGIN
        INSERT INTO buses (license_plate, created_at) VALUES ('TEST-123', NOW());
    EXCEPTION WHEN undefined_column THEN
        BEGIN
            INSERT INTO buses (plate_number, created_at) VALUES ('TEST-123', NOW());
        EXCEPTION WHEN undefined_column THEN
            BEGIN
                INSERT INTO buses (vehicle_number, created_at) VALUES ('TEST-123', NOW());
            EXCEPTION WHEN undefined_column THEN
                RAISE NOTICE 'Could not determine bus column names - run schema checker!';
            END;
        END;
    END;
END $$;

SELECT 'Buses created:' AS status, COUNT(*) AS count FROM buses;

-- Test 4: Show what we created
SELECT 
    'companies' AS table_name, COUNT(*) AS count FROM companies
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'buses', COUNT(*) FROM buses;

SELECT '========================================' AS separator;
SELECT 'NOW RUN: 000_check_schema.sql' AS next_step;
SELECT 'Copy the output and share it!' AS instruction;
SELECT '========================================' AS separator;
