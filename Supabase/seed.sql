-- Sample Seed Data
INSERT INTO companies (name, subscription_plan) VALUES 
  ('Alpha Transit', 'Premium'), 
  ('Beta Buses', 'Standard'),
  ('City Express', 'Basic');

-- Insert test users with various roles
INSERT INTO users (company_id, role, name, email, password_hash, is_active) VALUES
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'developer', 'Developer User', 'dev@alpha.com', 'password123', true),
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'admin', 'Admin User', 'admin@alpha.com', 'password123', true),
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'booking_officer', 'Booking Officer', 'booking@alpha.com', 'password123', true),
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'ops_manager', 'Operations Manager', 'ops@alpha.com', 'password123', true),
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'driver', 'Driver User', 'driver@alpha.com', 'password123', true),
  ((SELECT company_id FROM companies WHERE name='Beta Buses'), 'admin', 'Beta Admin', 'admin@beta.com', 'password123', true),
  ((SELECT company_id FROM companies WHERE name='City Express'), 'admin', 'City Admin', 'admin@city.com', 'password123', true);

-- Add sample buses
INSERT INTO buses (company_id, license_plate, capacity, status) VALUES
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'ABC123', 50, 'active'),
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'DEF456', 45, 'active'),
  ((SELECT company_id FROM companies WHERE name='Beta Buses'), 'GHI789', 40, 'active');

-- Add sample routes
INSERT INTO routes (company_id, origin, destination, stops, duration) VALUES
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'Cape Town', 'Johannesburg', '["Bellville", "Worcester", "Beaufort West"]', '18:00:00'),
  ((SELECT company_id FROM companies WHERE name='Alpha Transit'), 'Durban', 'Cape Town', '["Pietermaritzburg", "Bloemfontein", "Beaufort West"]', '20:00:00'),
  ((SELECT company_id FROM companies WHERE name='Beta Buses'), 'Port Elizabeth', 'Cape Town', '["George", "Mossel Bay", "Caledon"]', '12:00:00');
