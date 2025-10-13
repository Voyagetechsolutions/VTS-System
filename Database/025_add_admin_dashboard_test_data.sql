-- Add test data for Admin Dashboard
-- Run this AFTER running 024_create_admin_dashboard_tables.sql

-- Get a company_id and user_id for test data
DO $$
DECLARE
  test_company_id UUID := '323e03ac-3937-42af-8e6d-6a12481a487c';
  test_user_id UUID;
  test_bus_id UUID;
  test_booking_id UUID;
BEGIN
  -- Using your specific company ID
  -- test_company_id is already set above
  
  -- Get first user
  SELECT user_id INTO test_user_id FROM users LIMIT 1;
  
  -- Get first bus
  SELECT bus_id INTO test_bus_id FROM buses LIMIT 1;
  
  -- Get first booking
  SELECT booking_id INTO test_booking_id FROM bookings LIMIT 1;
  
  -- Insert test incidents
  INSERT INTO incidents (company_id, type, status, description, severity, reported_by)
  VALUES 
    (test_company_id, 'safety', 'open', 'Driver reported brake issue on Bus 123', 'high', test_user_id),
    (test_company_id, 'service', 'open', 'Passenger complaint about delayed departure', 'medium', test_user_id),
    (test_company_id, 'maintenance', 'investigating', 'Engine overheating on Route 5', 'high', test_user_id)
  ON CONFLICT DO NOTHING;
  
  -- Insert test refunds (only if bookings exist)
  IF test_booking_id IS NOT NULL THEN
    INSERT INTO refunds (booking_id, amount, status, reason, requested_by)
    VALUES 
      (test_booking_id, 1500.00, 'pending', 'Customer missed bus due to traffic', test_user_id),
      (test_booking_id, 2500.00, 'pending', 'Bus breakdown - full refund requested', test_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Insert test route requests
  INSERT INTO route_requests (company_id, route_name, origin, destination, request_type, requested_by, status)
  VALUES 
    (test_company_id, 'Joburg → Bulawayo Express', 'Johannesburg', 'Bulawayo', 'new', test_user_id, 'pending'),
    (test_company_id, 'Cape Town → Durban', 'Cape Town', 'Durban', 'modify', test_user_id, 'pending')
  ON CONFLICT DO NOTHING;
  
  -- Insert test maintenance requests (only if buses exist)
  IF test_bus_id IS NOT NULL THEN
    INSERT INTO maintenance_requests (bus_id, company_id, issue, priority, estimated_cost, status, requested_by)
    VALUES 
      (test_bus_id, test_company_id, 'Engine overhaul required', 'high', 15000.00, 'pending', test_user_id),
      (test_bus_id, test_company_id, 'Replace brake pads', 'medium', 3500.00, 'pending', test_user_id),
      (test_bus_id, test_company_id, 'AC system repair', 'low', 2000.00, 'approved', test_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Insert test HR actions
  INSERT INTO hr_actions (company_id, employee_id, action_type, details, status, requested_by)
  VALUES 
    (test_company_id, test_user_id, 'leave_request', 'Annual leave - 2 weeks', 'pending', test_user_id),
    (test_company_id, test_user_id, 'salary_adjustment', 'Performance-based salary increase', 'pending', test_user_id)
  ON CONFLICT DO NOTHING;
  
  -- Insert test staff records
  INSERT INTO staff (company_id, user_id, role, status, shift_start, shift_end, hire_date)
  SELECT 
    u.company_id,
    u.user_id,
    u.role,
    'active',
    '08:00:00',
    '17:00:00',
    CURRENT_DATE - INTERVAL '6 months'
  FROM users u
  WHERE u.company_id = test_company_id
  AND NOT EXISTS (SELECT 1 FROM staff WHERE user_id = u.user_id)
  LIMIT 5;
  
  RAISE NOTICE 'Test data inserted successfully';
END $$;

-- Verify data was inserted
SELECT 'Incidents' as table_name, COUNT(*) as count FROM incidents
UNION ALL
SELECT 'Refunds', COUNT(*) FROM refunds
UNION ALL
SELECT 'Route Requests', COUNT(*) FROM route_requests
UNION ALL
SELECT 'Maintenance Requests', COUNT(*) FROM maintenance_requests
UNION ALL
SELECT 'HR Actions', COUNT(*) FROM hr_actions
UNION ALL
SELECT 'Staff', COUNT(*) FROM staff;
