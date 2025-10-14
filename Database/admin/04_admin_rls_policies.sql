-- =====================================================
-- VTS ADMIN ROW LEVEL SECURITY POLICIES
-- Security policies for admin dashboard access
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL ADMIN TABLES
-- =====================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADMIN USER POLICIES
-- =====================================================

-- Admin users can view their own record and others in same company
CREATE POLICY "admin_users_select_policy" ON admin_users
    FOR SELECT USING (
        id = auth.uid()::uuid OR 
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid()::uuid
        )
    );

-- Only super admins can insert admin users
CREATE POLICY "admin_users_insert_policy" ON admin_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid()::uuid 
            AND role = 'super_admin'
        )
    );

-- Admin users can update their own record
CREATE POLICY "admin_users_update_policy" ON admin_users
    FOR UPDATE USING (id = auth.uid()::uuid);

-- =====================================================
-- ADMIN SESSION POLICIES
-- =====================================================

-- Admin users can view their own sessions
CREATE POLICY "admin_sessions_select_policy" ON admin_sessions
    FOR SELECT USING (admin_user_id = auth.uid()::uuid);

-- Admin users can insert their own sessions
CREATE POLICY "admin_sessions_insert_policy" ON admin_sessions
    FOR INSERT WITH CHECK (admin_user_id = auth.uid()::uuid);

-- Admin users can delete their own sessions
CREATE POLICY "admin_sessions_delete_policy" ON admin_sessions
    FOR DELETE USING (admin_user_id = auth.uid()::uuid);

-- =====================================================
-- COMPANY-BASED POLICIES
-- =====================================================

-- Function to get admin user's company
CREATE OR REPLACE FUNCTION get_admin_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM admin_users 
        WHERE id = auth.uid()::uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Companies policy - admin can view their own company
CREATE POLICY "companies_admin_policy" ON companies
    FOR ALL USING (
        id = get_admin_company_id() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid()::uuid 
            AND role = 'super_admin'
        )
    );

-- Company branches policy
CREATE POLICY "company_branches_admin_policy" ON company_branches
    FOR ALL USING (company_id = get_admin_company_id());

-- Staff policy
CREATE POLICY "staff_admin_policy" ON staff
    FOR ALL USING (company_id = get_admin_company_id());

-- Staff shifts policy
CREATE POLICY "staff_shifts_admin_policy" ON staff_shifts
    FOR ALL USING (company_id = get_admin_company_id());

-- Staff attendance policy
CREATE POLICY "staff_attendance_admin_policy" ON staff_attendance
    FOR ALL USING (company_id = get_admin_company_id());

-- Buses policy
CREATE POLICY "buses_admin_policy" ON buses
    FOR ALL USING (company_id = get_admin_company_id());

-- Maintenance logs policy
CREATE POLICY "maintenance_logs_admin_policy" ON maintenance_logs
    FOR ALL USING (company_id = get_admin_company_id());

-- Fuel logs policy
CREATE POLICY "fuel_logs_admin_policy" ON fuel_logs
    FOR ALL USING (company_id = get_admin_company_id());

-- Routes policy
CREATE POLICY "routes_admin_policy" ON routes
    FOR ALL USING (company_id = get_admin_company_id());

-- Trips policy
CREATE POLICY "trips_admin_policy" ON trips
    FOR ALL USING (company_id = get_admin_company_id());

-- Bookings policy
CREATE POLICY "bookings_admin_policy" ON bookings
    FOR ALL USING (company_id = get_admin_company_id());

-- Payments policy
CREATE POLICY "payments_admin_policy" ON payments
    FOR ALL USING (company_id = get_admin_company_id());

-- Expense categories policy
CREATE POLICY "expense_categories_admin_policy" ON expense_categories
    FOR ALL USING (company_id = get_admin_company_id());

-- Expenses policy
CREATE POLICY "expenses_admin_policy" ON expenses
    FOR ALL USING (company_id = get_admin_company_id());

-- =====================================================
-- ADMIN ACTIVITY LOG POLICIES
-- =====================================================

-- Admin users can view activity logs for their company
CREATE POLICY "admin_activity_log_select_policy" ON admin_activity_log
    FOR SELECT USING (
        company_id = get_admin_company_id() OR
        admin_user_id = auth.uid()::uuid
    );

-- Admin users can insert activity logs for their company
CREATE POLICY "admin_activity_log_insert_policy" ON admin_activity_log
    FOR INSERT WITH CHECK (
        company_id = get_admin_company_id() OR
        admin_user_id = auth.uid()::uuid
    );

-- =====================================================
-- ROLE-BASED POLICIES
-- =====================================================

-- Function to check admin role
CREATE OR REPLACE FUNCTION check_admin_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = auth.uid()::uuid 
        AND (role = required_role OR role = 'super_admin')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check admin permission
CREATE OR REPLACE FUNCTION check_admin_permission(permission_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = auth.uid()::uuid 
        AND (
            role = 'super_admin' OR
            (permissions->permission_key)::boolean = true
        )
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

-- Function to automatically log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_admin_id UUID;
    v_company_id UUID;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
    END IF;

    -- Get admin user ID and company ID
    v_admin_id := auth.uid()::uuid;
    
    IF TG_OP = 'DELETE' THEN
        v_company_id := OLD.company_id;
    ELSE
        v_company_id := NEW.company_id;
    END IF;

    -- Skip logging for admin_activity_log table to avoid recursion
    IF TG_TABLE_NAME = 'admin_activity_log' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- Insert activity log
    INSERT INTO admin_activity_log (
        admin_user_id, 
        company_id, 
        action, 
        resource_type, 
        resource_id,
        details
    ) VALUES (
        v_admin_id,
        v_company_id,
        v_action,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for important tables
CREATE TRIGGER admin_activity_companies_trigger
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity_trigger();

CREATE TRIGGER admin_activity_staff_trigger
    AFTER INSERT OR UPDATE OR DELETE ON staff
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity_trigger();

CREATE TRIGGER admin_activity_buses_trigger
    AFTER INSERT OR UPDATE OR DELETE ON buses
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity_trigger();

CREATE TRIGGER admin_activity_routes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON routes
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity_trigger();

CREATE TRIGGER admin_activity_trips_trigger
    AFTER INSERT OR UPDATE OR DELETE ON trips
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity_trigger();

CREATE TRIGGER admin_activity_bookings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity_trigger();

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for tables that have updated_at column
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_branches_updated_at
    BEFORE UPDATE ON company_branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_shifts_updated_at
    BEFORE UPDATE ON staff_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buses_updated_at
    BEFORE UPDATE ON buses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_logs_updated_at
    BEFORE UPDATE ON maintenance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
