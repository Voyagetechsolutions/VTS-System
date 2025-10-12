-- Verify your user has developer role and auth_user_id is set correctly

-- 1. Check current authenticated user
SELECT 
  auth.uid() as current_auth_uid,
  auth.email() as current_email;

-- 2. Check if your user record exists and has developer role
SELECT 
  user_id,
  name,
  email,
  role,
  auth_user_id,
  is_active,
  CASE 
    WHEN auth_user_id = auth.uid() THEN '✅ Auth linked correctly'
    WHEN auth_user_id IS NULL THEN '❌ auth_user_id is NULL - needs to be set'
    ELSE '❌ auth_user_id mismatch'
  END as auth_status,
  CASE 
    WHEN role = 'developer' THEN '✅ Has developer role'
    ELSE '❌ Not a developer - role is: ' || role
  END as role_status
FROM users 
WHERE email = auth.email();

-- 3. If auth_user_id is not set, run this to fix it:
-- UPDATE users 
-- SET auth_user_id = auth.uid()
-- WHERE email = auth.email() AND auth_user_id IS NULL;

-- 4. If role is not 'developer', run this to fix it:
-- UPDATE users 
-- SET role = 'developer'
-- WHERE email = auth.email();
