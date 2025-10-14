-- =====================================================
-- VTS ADMIN SYSTEM SETUP SCRIPT
-- Complete setup for admin dashboard functionality
-- =====================================================

-- Run this script to set up the complete admin system
-- Execute in order: 01 -> 02 -> 03 -> 04 -> 06

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default super admin (change password after first login)
DO $$
DECLARE
    v_super_admin_id UUID;
BEGIN
    -- Create super admin user
    SELECT create_admin_user(
        'admin@vtssystem.com',
        'VTS@Admin2024!',
        'System Administrator',
        'super_admin',
        NULL,
        '{"all_permissions": true, "manage_companies": true, "manage_admins": true}'::jsonb
    ) INTO v_super_admin_id;
    
    RAISE NOTICE 'Super admin created with ID: %', v_super_admin_id;
END $$;

-- =====================================================
-- SAMPLE COMPANY DATA (for testing)
-- =====================================================

DO $$
DECLARE
    v_company_id UUID;
    v_admin_id UUID;
    v_branch_id UUID;
    v_route_id UUID;
    v_bus_id UUID;
    v_driver_id UUID;
    v_trip_id UUID;
    v_booking_id UUID;
BEGIN
    -- Create sample company
    SELECT create_company(
        'Metro Bus Lines',
        'info@metrobuslines.com',
        '+1-555-0123',
        '123 Transit Ave',
        'Metro City',
        'Metro State',
        'USA',
        'premium'
    ) INTO v_company_id;
    
    -- Create company admin
    SELECT create_admin_user(
        'admin@metrobuslines.com',
        'Metro@2024!',
        'Metro Admin',
        'company_admin',
        v_company_id,
        '{"manage_bookings": true, "view_reports": true, "manage_fleet": true}'::jsonb
    ) INTO v_admin_id;
    
    -- Create company branch
    INSERT INTO company_branches (company_id, name, code, address, city, state, phone, email)
    VALUES (v_company_id, 'Main Terminal', 'MT001', '456 Main St', 'Metro City', 'Metro State', '+1-555-0124', 'terminal@metrobuslines.com')
    RETURNING id INTO v_branch_id;
    
    -- Create sample route
    INSERT INTO routes (company_id, name, code, pick_up, drop_off, distance, estimated_duration, base_fare)
    VALUES (v_company_id, 'Downtown Express', 'DTE001', 'Metro Central', 'Downtown Plaza', 15.5, 45, 12.50)
    RETURNING id INTO v_route_id;
    
    -- Create sample bus
    INSERT INTO buses (company_id, branch_id, name, license_plate, model, manufacturer, year, capacity, type, status)
    VALUES (v_company_id, v_branch_id, 'Metro Express 1', 'MBL-001', 'City Cruiser 3000', 'Transit Motors', 2022, 45, 'express', 'active')
    RETURNING id INTO v_bus_id;
    
    -- Create sample driver
    INSERT INTO staff (company_id, branch_id, employee_id, email, phone, name, role, department, position, hire_date, salary, license_number, status)
    VALUES (v_company_id, v_branch_id, 'DRV001', 'john.driver@metrobuslines.com', '+1-555-0125', 'John Driver', 'Driver', 'Operations', 'Senior Driver', '2023-01-15', 45000.00, 'CDL123456', 'active')
    RETURNING id INTO v_driver_id;
    
    -- Create sample trip
    INSERT INTO trips (company_id, route_id, bus_id, driver_id, departure, arrival, fare, available_seats, status)
    VALUES (v_company_id, v_route_id, v_bus_id, v_driver_id, 
            NOW() + INTERVAL '2 hours', 
            NOW() + INTERVAL '2 hours 45 minutes', 
            12.50, 44, 'scheduled')
    RETURNING id INTO v_trip_id;
    
    -- Create sample booking
    SELECT create_booking(
        v_company_id,
        v_trip_id,
        'Jane Passenger',
        '+1-555-0126',
        'jane@email.com',
        'A1',
        12.50,
        'online'
    ) INTO v_booking_id;
    
    -- Create sample payment
    INSERT INTO payments (company_id, booking_id, amount, payment_method, payment_reference, transaction_id, status)
    VALUES (v_company_id, v_booking_id, 12.50, 'credit_card', 'REF123456', 'TXN789012', 'completed');
    
    -- Create sample maintenance log
    INSERT INTO maintenance_logs (company_id, bus_id, maintenance_type, description, cost, service_provider, maintenance_date, mechanic_id, status)
    VALUES (v_company_id, v_bus_id, 'routine', 'Regular maintenance check', 250.00, 'Metro Garage', CURRENT_DATE, NULL, 'completed');
    
    -- Create sample fuel log
    INSERT INTO fuel_logs (company_id, bus_id, driver_id, fuel_station, fuel_type, quantity, cost_per_liter, total_cost, odometer_reading, fuel_date)
    VALUES (v_company_id, v_bus_id, v_driver_id, 'Shell Station', 'diesel', 80.5, 1.45, 116.73, 15420, CURRENT_DATE);
    
    -- Create sample expense
    INSERT INTO expenses (company_id, category_id, amount, description, expense_date, status)
    VALUES (v_company_id, 
            (SELECT id FROM expense_categories WHERE company_id = v_company_id AND name = 'Fuel' LIMIT 1),
            116.73, 'Fuel for Metro Express 1', CURRENT_DATE, 'approved');
    
    RAISE NOTICE 'Sample company data created for company ID: %', v_company_id;
    RAISE NOTICE 'Company admin created with email: admin@metrobuslines.com';
    RAISE NOTICE 'Use password: Metro@2024!';
END $$;

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Additional indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_booking_datetime ON bookings(booking_datetime);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_passenger_name ON bookings(passenger_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_status ON staff(status);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_company_status_date ON bookings(company_id, status, booking_datetime);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_company_departure ON trips(company_id, departure);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_company_status_date ON payments(company_id, status, payment_date);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for booking details with related data
CREATE OR REPLACE VIEW admin_booking_details AS
SELECT 
    b.id,
    b.company_id,
    b.passenger_name,
    b.passenger_phone,
    b.passenger_email,
    b.seat_number,
    b.booking_datetime,
    b.fare,
    b.payment_status,
    b.booking_channel,
    b.status,
    t.id as trip_id,
    t.departure,
    t.arrival,
    r.name as route_name,
    r.pick_up,
    r.drop_off,
    bus.name as bus_name,
    bus.license_plate,
    driver.name as driver_name,
    p.amount as payment_amount,
    p.payment_method,
    p.payment_date,
    p.status as payment_status_detail
FROM bookings b
LEFT JOIN trips t ON b.trip_id = t.id
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN buses bus ON t.bus_id = bus.id
LEFT JOIN staff driver ON t.driver_id = driver.id
LEFT JOIN payments p ON b.id = p.booking_id;

-- View for trip details with related data
CREATE OR REPLACE VIEW admin_trip_details AS
SELECT 
    t.id,
    t.company_id,
    t.departure,
    t.arrival,
    t.actual_departure,
    t.actual_arrival,
    t.fare,
    t.available_seats,
    t.status,
    r.name as route_name,
    r.pick_up,
    r.drop_off,
    r.distance,
    r.estimated_duration,
    bus.name as bus_name,
    bus.license_plate,
    bus.capacity,
    driver.name as driver_name,
    driver.phone as driver_phone,
    (SELECT COUNT(*) FROM bookings WHERE trip_id = t.id AND status != 'cancelled') as booked_seats
FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN buses bus ON t.bus_id = bus.id
LEFT JOIN staff driver ON t.driver_id = driver.id;

-- View for financial summary
CREATE OR REPLACE VIEW admin_financial_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    -- Revenue metrics
    COALESCE(revenue.total_revenue, 0) as total_revenue,
    COALESCE(revenue.monthly_revenue, 0) as monthly_revenue,
    COALESCE(revenue.daily_revenue, 0) as daily_revenue,
    -- Expense metrics
    COALESCE(expenses.total_expenses, 0) as total_expenses,
    COALESCE(expenses.monthly_expenses, 0) as monthly_expenses,
    COALESCE(expenses.daily_expenses, 0) as daily_expenses,
    -- Booking metrics
    COALESCE(bookings.total_bookings, 0) as total_bookings,
    COALESCE(bookings.monthly_bookings, 0) as monthly_bookings,
    COALESCE(bookings.daily_bookings, 0) as daily_bookings
FROM companies c
LEFT JOIN (
    SELECT 
        b.company_id,
        SUM(p.amount) as total_revenue,
        SUM(CASE WHEN DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', CURRENT_DATE) THEN p.amount ELSE 0 END) as monthly_revenue,
        SUM(CASE WHEN DATE(p.payment_date) = CURRENT_DATE THEN p.amount ELSE 0 END) as daily_revenue
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    WHERE p.status = 'completed'
    GROUP BY b.company_id
) revenue ON c.id = revenue.company_id
LEFT JOIN (
    SELECT 
        company_id,
        SUM(amount) as total_expenses,
        SUM(CASE WHEN DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) as monthly_expenses,
        SUM(CASE WHEN expense_date = CURRENT_DATE THEN amount ELSE 0 END) as daily_expenses
    FROM expenses
    WHERE status = 'approved'
    GROUP BY company_id
) expenses ON c.id = expenses.company_id
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN DATE_TRUNC('month', booking_datetime) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as monthly_bookings,
        COUNT(CASE WHEN DATE(booking_datetime) = CURRENT_DATE THEN 1 END) as daily_bookings
    FROM bookings
    WHERE status != 'cancelled'
    GROUP BY company_id
) bookings ON c.id = bookings.company_id;

-- =====================================================
-- FINAL SETUP CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'VTS ADMIN SYSTEM SETUP COMPLETED SUCCESSFULLY';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Super Admin Credentials:';
    RAISE NOTICE 'Email: admin@vtssystem.com';
    RAISE NOTICE 'Password: VTS@Admin2024!';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Company Admin Credentials:';
    RAISE NOTICE 'Email: admin@metrobuslines.com';
    RAISE NOTICE 'Password: Metro@2024!';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Change default passwords after first login!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Deploy edge functions to Supabase';
    RAISE NOTICE '2. Update frontend API configuration';
    RAISE NOTICE '3. Test admin login functionality';
    RAISE NOTICE '4. Configure RLS policies as needed';
    RAISE NOTICE '==============================================';
END $$;
