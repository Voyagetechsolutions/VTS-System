-- COMPREHENSIVE FIX for platform_settings RLS issues
-- This script will ensure your user can save settings

-- Step 1: Verify and fix your user's developer role and auth linkage
DO $$ 
DECLARE
  current_user_email TEXT;
  current_auth_id UUID;
BEGIN
  -- Get current user's email and auth ID
  SELECT auth.email() INTO current_user_email;
  SELECT auth.uid() INTO current_auth_id;
  
  RAISE NOTICE 'Current user email: %', current_user_email;
  RAISE NOTICE 'Current auth UID: %', current_auth_id;
  
  -- Update or insert user with developer role and correct auth_user_id
  INSERT INTO users (email, name, role, auth_user_id, is_active)
  VALUES (
    current_user_email,
    'Developer User',
    'developer',
    current_auth_id,
    true
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    role = 'developer',
    auth_user_id = current_auth_id,
    is_active = true;
    
  RAISE NOTICE 'User updated/created with developer role';
END $$;

-- Step 2: Drop all existing policies on platform_settings
DROP POLICY IF EXISTS "Developers have full access to platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Developers can view platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Developers can update platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Developers can insert platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Developers can delete platform settings" ON platform_settings;

-- Step 3: Create a comprehensive policy that definitely works
CREATE POLICY "Developer full access to platform_settings"
ON platform_settings
FOR ALL
TO authenticated
USING (
  -- Allow if user is a developer
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
    AND users.is_active = true
  )
)
WITH CHECK (
  -- Allow if user is a developer
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
    AND users.is_active = true
  )
);

-- Step 4: Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'platform_settings';

-- Step 5: Test that your user can be found
SELECT 
  'Your user record:' as info,
  user_id,
  email,
  role,
  auth_user_id,
  is_active,
  CASE 
    WHEN auth_user_id = auth.uid() THEN '✅ Auth linked'
    ELSE '❌ Auth NOT linked'
  END as auth_status
FROM users 
WHERE auth_user_id = auth.uid();

-- Step 6: If still having issues, you can temporarily disable RLS (NOT RECOMMENDED FOR PRODUCTION)
-- Uncomment the line below ONLY for testing:
-- ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS after testing:
-- ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
