-- =====================================================
-- VTS ADMIN DATABASE FUNCTIONS
-- Company Administration Functions
-- =====================================================

-- =====================================================
-- ADMIN USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create admin user
CREATE OR REPLACE FUNCTION create_admin_user(
    p_email VARCHAR(255),
    p_password TEXT,
    p_full_name VARCHAR(255),
    p_role VARCHAR(50) DEFAULT 'admin',
    p_company_id UUID DEFAULT NULL,
    p_permissions JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_admin_id UUID;
    v_password_hash TEXT;
BEGIN
    -- Hash the password
    v_password_hash := crypt(p_password, gen_salt('bf'));
    
    -- Insert admin user
    INSERT INTO admin_users (email, password_hash, full_name, role, company_id, permissions)
    VALUES (p_email, v_password_hash, p_full_name, p_role, p_company_id, p_permissions)
    RETURNING id INTO v_admin_id;
    
    -- Log the activity
    INSERT INTO admin_activity_log (admin_user_id, company_id, action, resource_type, resource_id, details)
    VALUES (v_admin_id, p_company_id, 'CREATE', 'admin_user', v_admin_id, 
            jsonb_build_object('email', p_email, 'role', p_role));
    
    RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate admin user
CREATE OR REPLACE FUNCTION authenticate_admin_user(
    p_email VARCHAR(255),
    p_password TEXT
)
RETURNS TABLE(
    admin_id UUID,
    full_name VARCHAR(255),
    role VARCHAR(50),
    company_id UUID,
    permissions JSONB,
    session_token TEXT
) AS $$
DECLARE
    v_admin_record RECORD;
    v_session_token TEXT;
    v_session_id UUID;
BEGIN
    -- Find admin user and verify password
    SELECT au.id, au.full_name, au.role, au.company_id, au.permissions, au.password_hash
    INTO v_admin_record
    FROM admin_users au
    WHERE au.email = p_email AND au.is_active = true;
    
    -- Check if user exists and password is correct
    IF v_admin_record.id IS NULL OR NOT (v_admin_record.password_hash = crypt(p_password, v_admin_record.password_hash)) THEN
        RETURN;
    END IF;
    
    -- Generate session token
    v_session_token := encode(gen_random_bytes(32), 'base64');
    
    -- Create session
    INSERT INTO admin_sessions (admin_user_id, session_token, expires_at)
    VALUES (v_admin_record.id, v_session_token, NOW() + INTERVAL '24 hours')
    RETURNING id INTO v_session_id;
    
    -- Update last login
    UPDATE admin_users SET last_login = NOW() WHERE id = v_admin_record.id;
    
    -- Log the activity
    INSERT INTO admin_activity_log (admin_user_id, company_id, action, resource_type, resource_id)
    VALUES (v_admin_record.id, v_admin_record.company_id, 'LOGIN', 'admin_session', v_session_id);
    
    -- Return user data
    RETURN QUERY SELECT 
        v_admin_record.id,
        v_admin_record.full_name,
        v_admin_record.role,
        v_admin_record.company_id,
        v_admin_record.permissions,
        v_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate admin session
CREATE OR REPLACE FUNCTION validate_admin_session(p_session_token TEXT)
RETURNS TABLE(
    admin_id UUID,
    full_name VARCHAR(255),
    role VARCHAR(50),
    company_id UUID,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT au.id, au.full_name, au.role, au.company_id, au.permissions
    FROM admin_users au
    JOIN admin_sessions s ON au.id = s.admin_user_id
    WHERE s.session_token = p_session_token 
      AND s.expires_at > NOW()
      AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPANY MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create company
CREATE OR REPLACE FUNCTION create_company(
    p_name VARCHAR(255),
    p_email VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL,
    p_state VARCHAR(100) DEFAULT NULL,
    p_country VARCHAR(100) DEFAULT NULL,
    p_subscription_plan VARCHAR(50) DEFAULT 'basic',
    p_admin_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_company_id UUID;
BEGIN
    -- Insert company
    INSERT INTO companies (name, email, phone, address, city, state, country, subscription_plan)
    VALUES (p_name, p_email, p_phone, p_address, p_city, p_state, p_country, p_subscription_plan)
    RETURNING id INTO v_company_id;
    
    -- Create default expense categories
    INSERT INTO expense_categories (company_id, name, description) VALUES
    (v_company_id, 'Fuel', 'Fuel and gas expenses'),
    (v_company_id, 'Maintenance', 'Vehicle maintenance and repairs'),
    (v_company_id, 'Salaries', 'Staff salaries and wages'),
    (v_company_id, 'Insurance', 'Insurance premiums'),
    (v_company_id, 'Office', 'Office supplies and utilities'),
    (v_company_id, 'Marketing', 'Marketing and advertising'),
    (v_company_id, 'Other', 'Miscellaneous expenses');
    
    -- Log the activity
    IF p_admin_user_id IS NOT NULL THEN
        INSERT INTO admin_activity_log (admin_user_id, company_id, action, resource_type, resource_id, details)
        VALUES (p_admin_user_id, v_company_id, 'CREATE', 'company', v_company_id, 
                jsonb_build_object('name', p_name, 'subscription_plan', p_subscription_plan));
    END IF;
    
    RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get company dashboard metrics
CREATE OR REPLACE FUNCTION get_company_dashboard_metrics(p_company_id UUID)
RETURNS TABLE(
    total_buses INTEGER,
    active_buses INTEGER,
    total_drivers INTEGER,
    active_drivers INTEGER,
    total_routes INTEGER,
    active_routes INTEGER,
    today_trips INTEGER,
    completed_trips INTEGER,
    total_bookings INTEGER,
    confirmed_bookings INTEGER,
    total_revenue DECIMAL(12,2),
    monthly_revenue DECIMAL(12,2),
    total_expenses DECIMAL(12,2),
    monthly_expenses DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Bus metrics
        (SELECT COUNT(*)::INTEGER FROM buses WHERE company_id = p_company_id),
        (SELECT COUNT(*)::INTEGER FROM buses WHERE company_id = p_company_id AND status = 'active'),
        
        -- Driver metrics
        (SELECT COUNT(*)::INTEGER FROM staff WHERE company_id = p_company_id AND role = 'Driver'),
        (SELECT COUNT(*)::INTEGER FROM staff WHERE company_id = p_company_id AND role = 'Driver' AND status = 'active'),
        
        -- Route metrics
        (SELECT COUNT(*)::INTEGER FROM routes WHERE company_id = p_company_id),
        (SELECT COUNT(*)::INTEGER FROM routes WHERE company_id = p_company_id AND is_active = true),
        
        -- Trip metrics
        (SELECT COUNT(*)::INTEGER FROM trips WHERE company_id = p_company_id AND DATE(departure) = CURRENT_DATE),
        (SELECT COUNT(*)::INTEGER FROM trips WHERE company_id = p_company_id AND status = 'completed'),
        
        -- Booking metrics
        (SELECT COUNT(*)::INTEGER FROM bookings WHERE company_id = p_company_id),
        (SELECT COUNT(*)::INTEGER FROM bookings WHERE company_id = p_company_id AND status = 'confirmed'),
        
        -- Revenue metrics
        (SELECT COALESCE(SUM(amount), 0) FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.company_id = p_company_id AND p.status = 'completed'),
        (SELECT COALESCE(SUM(amount), 0) FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.company_id = p_company_id AND p.status = 'completed' AND DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', CURRENT_DATE)),
        
        -- Expense metrics
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE company_id = p_company_id AND status = 'approved'),
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE company_id = p_company_id AND status = 'approved' AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- BOOKING MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create booking
CREATE OR REPLACE FUNCTION create_booking(
    p_company_id UUID,
    p_trip_id UUID,
    p_passenger_name VARCHAR(255),
    p_fare DECIMAL(8,2),
    p_passenger_phone VARCHAR(20) DEFAULT NULL,
    p_passenger_email VARCHAR(255) DEFAULT NULL,
    p_seat_number VARCHAR(10) DEFAULT NULL,
    p_booking_channel VARCHAR(50) DEFAULT 'online',
    p_admin_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_available_seats INTEGER;
BEGIN
    -- Check available seats
    SELECT available_seats INTO v_available_seats
    FROM trips WHERE id = p_trip_id AND company_id = p_company_id;
    
    IF v_available_seats IS NULL THEN
        RAISE EXCEPTION 'Trip not found';
    END IF;
    
    IF v_available_seats <= 0 THEN
        RAISE EXCEPTION 'No available seats';
    END IF;
    
    -- Create booking
    INSERT INTO bookings (company_id, trip_id, passenger_name, passenger_phone, passenger_email, 
                         seat_number, fare, booking_channel)
    VALUES (p_company_id, p_trip_id, p_passenger_name, p_passenger_phone, p_passenger_email,
            p_seat_number, p_fare, p_booking_channel)
    RETURNING id INTO v_booking_id;
    
    -- Update available seats
    UPDATE trips SET available_seats = available_seats - 1 WHERE id = p_trip_id;
    
    -- Log the activity
    IF p_admin_user_id IS NOT NULL THEN
        INSERT INTO admin_activity_log (admin_user_id, company_id, action, resource_type, resource_id, details)
        VALUES (p_admin_user_id, p_company_id, 'CREATE', 'booking', v_booking_id, 
                jsonb_build_object('passenger_name', p_passenger_name, 'fare', p_fare));
    END IF;
    
    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel booking
CREATE OR REPLACE FUNCTION cancel_booking(
    p_booking_id UUID,
    p_company_id UUID,
    p_admin_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_trip_id UUID;
    v_booking_exists BOOLEAN;
BEGIN
    -- Check if booking exists and get trip_id
    SELECT trip_id INTO v_trip_id
    FROM bookings 
    WHERE id = p_booking_id AND company_id = p_company_id AND status != 'cancelled';
    
    IF v_trip_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Cancel booking
    UPDATE bookings SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Restore available seat
    UPDATE trips SET available_seats = available_seats + 1 WHERE id = v_trip_id;
    
    -- Log the activity
    IF p_admin_user_id IS NOT NULL THEN
        INSERT INTO admin_activity_log (admin_user_id, company_id, action, resource_type, resource_id)
        VALUES (p_admin_user_id, p_company_id, 'CANCEL', 'booking', p_booking_id);
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FINANCIAL REPORTING FUNCTIONS
-- =====================================================

-- Function to get revenue by date range
CREATE OR REPLACE FUNCTION get_revenue_by_date_range(
    p_company_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    revenue_date DATE,
    total_bookings INTEGER,
    total_revenue DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(p.payment_date) as revenue_date,
        COUNT(b.id)::INTEGER as total_bookings,
        SUM(p.amount) as total_revenue
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    WHERE b.company_id = p_company_id
      AND p.status = 'completed'
      AND DATE(p.payment_date) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(p.payment_date)
    ORDER BY revenue_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue by route
CREATE OR REPLACE FUNCTION get_revenue_by_route(
    p_company_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    route_name VARCHAR(255),
    total_bookings INTEGER,
    total_revenue DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CONCAT(r.pick_up, ' → ', r.drop_off) as route_name,
        COUNT(b.id)::INTEGER as total_bookings,
        SUM(p.amount) as total_revenue
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    JOIN trips t ON b.trip_id = t.id
    JOIN routes r ON t.route_id = r.id
    WHERE b.company_id = p_company_id
      AND p.status = 'completed'
      AND (p_start_date IS NULL OR DATE(p.payment_date) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(p.payment_date) <= p_end_date)
    GROUP BY r.id, r.pick_up, r.drop_off
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expenses by category
CREATE OR REPLACE FUNCTION get_expenses_by_category(
    p_company_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    category_name VARCHAR(100),
    total_expenses DECIMAL(12,2),
    expense_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ec.name, 'Uncategorized') as category_name,
        SUM(e.amount) as total_expenses,
        COUNT(e.id)::INTEGER as expense_count
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.company_id = p_company_id
      AND e.status = 'approved'
      AND (p_start_date IS NULL OR e.expense_date >= p_start_date)
      AND (p_end_date IS NULL OR e.expense_date <= p_end_date)
    GROUP BY ec.id, ec.name
    ORDER BY total_expenses DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT AND ACTIVITY FUNCTIONS
-- =====================================================

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_user_id UUID,
    p_company_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_activity_log (admin_user_id, company_id, action, resource_type, resource_id, 
                                   details, ip_address, user_agent)
    VALUES (p_admin_user_id, p_company_id, p_action, p_resource_type, p_resource_id,
            p_details, p_ip_address, p_user_agent)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin activity logs
CREATE OR REPLACE FUNCTION get_admin_activity_logs(
    p_company_id UUID,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0,
    p_admin_user_id UUID DEFAULT NULL,
    p_action VARCHAR(100) DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
    log_id UUID,
    admin_user_name VARCHAR(255),
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aal.id,
        au.full_name,
        aal.action,
        aal.resource_type,
        aal.resource_id,
        aal.details,
        aal.ip_address,
        aal.created_at
    FROM admin_activity_log aal
    LEFT JOIN admin_users au ON aal.admin_user_id = au.id
    WHERE aal.company_id = p_company_id
      AND (p_admin_user_id IS NULL OR aal.admin_user_id = p_admin_user_id)
      AND (p_action IS NULL OR aal.action = p_action)
      AND (p_start_date IS NULL OR aal.created_at >= p_start_date)
      AND (p_end_date IS NULL OR aal.created_at <= p_end_date)
    ORDER BY aal.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
