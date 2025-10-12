-- Fix platform_settings table
-- Drop and recreate with correct schema

DROP TABLE IF EXISTS platform_settings CASCADE;

CREATE TABLE platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Developers can view platform settings"
ON platform_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can update platform settings"
ON platform_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can insert platform settings"
ON platform_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- Insert default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('platformName', 'VTS Bus Management System', 'Platform display name'),
  ('defaultTimezone', 'Africa/Johannesburg', 'Default timezone for the platform'),
  ('defaultCurrency', 'ZAR', 'Default currency code'),
  ('defaultLanguage', 'en', 'Default language code'),
  ('maintenanceMode', 'false', 'Enable/disable maintenance mode'),
  ('allowRegistration', 'true', 'Allow new company registrations'),
  ('maxCompanies', '1000', 'Maximum number of companies allowed'),
  ('supportEmail', 'support@vts.com', 'Support contact email'),
  ('supportPhone', '+27 11 123 4567', 'Support contact phone')
ON CONFLICT (key) DO NOTHING;

-- Fix announcements table - add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE announcements ADD COLUMN created_by UUID REFERENCES users(user_id);
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'status'
  ) THEN
    ALTER TABLE announcements ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
  END IF;

  -- Add sent_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE announcements ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add target_audience column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE announcements ADD COLUMN target_audience VARCHAR(50) DEFAULT 'all';
  END IF;

  -- Add delivery_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'delivery_method'
  ) THEN
    ALTER TABLE announcements ADD COLUMN delivery_method VARCHAR(50) DEFAULT 'both';
  END IF;

  -- Add priority column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'priority'
  ) THEN
    ALTER TABLE announcements ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
  END IF;
END $$;

-- Ensure RLS is enabled on announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Developers can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Developers can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Developers can update announcements" ON announcements;
DROP POLICY IF EXISTS "Developers can delete announcements" ON announcements;

-- Create RLS policies for announcements
CREATE POLICY "Developers can view all announcements"
ON announcements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can insert announcements"
ON announcements FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can update announcements"
ON announcements FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can delete announcements"
ON announcements FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);
