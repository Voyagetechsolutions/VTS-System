# Developer Dashboard RLS (Row Level Security) Fix

## Problem

The Developer Dashboard is experiencing errors when trying to fetch data:

```
Failed to load resource: the server responded with a status of 400
company_id=eq.null
Cannot read properties of undefined (reading 'company_id')
```

## Root Cause

Supabase Row Level Security (RLS) policies are automatically filtering queries by `company_id`. When a developer user logs in without a specific company context (`window.companyId` is null), the RLS policies add `company_id=eq.null` to queries, which fails because:

1. The developer role needs to see data across ALL companies
2. The current RLS policies only allow users to see data for their own company
3. Activity logs, bookings, users, etc. are being filtered by company_id even for developers

## Solution

### Option 1: Apply Developer RLS Policies (Recommended)

Run the SQL script `Database/006_developer_rls_policies.sql` in your Supabase SQL Editor. This will:

1. Create RLS policies that allow users with `role = 'developer'` to bypass company-scoped restrictions
2. Grant developers SELECT, UPDATE, INSERT, DELETE permissions on all tables
3. Allow developers to view and manage data across all companies

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `Database/006_developer_rls_policies.sql`
3. Run the script
4. Verify policies are created: `SELECT * FROM pg_policies WHERE tablename = 'activity_log';`

### Option 2: Temporarily Disable RLS (Not Recommended for Production)

For testing only, you can disable RLS on specific tables:

```sql
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
-- etc.
```

**Warning:** This removes all security and should only be used in development!

### Option 3: Use Service Role Key (Not Recommended for Frontend)

You could use the Supabase service role key which bypasses RLS, but this is a security risk in frontend code as it exposes full database access.

## Verification

After applying the fix, verify:

1. **Login as Developer:**
   - Email: developer@example.com
   - Role: developer

2. **Check Developer Dashboard:**
   - Navigate to `/developer-dashboard`
   - Monitoring & Logs tab should load activity logs from all companies
   - Companies tab should show all companies
   - Users tab should show all users

3. **Check Browser Console:**
   - No more 400 errors
   - No more `company_id=eq.null` in failed requests
   - No more "Cannot read properties of undefined" errors

## Database Schema Requirements

Ensure your `users` table has a `role` column:

```sql
-- Check if role column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- If not, add it
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Update a user to be a developer
UPDATE users SET role = 'developer' WHERE email = 'your-dev-email@example.com';
```

## Testing

1. **Test Developer Access:**
   ```javascript
   // In browser console after logging in as developer
   const { data, error } = await supabase.from('activity_log').select('*').limit(10);
   console.log('Activity logs:', data, error);
   ```

2. **Test Company Admin Access (should still be restricted):**
   ```javascript
   // Login as company admin
   // Should only see their company's data
   const { data, error } = await supabase.from('activity_log').select('*').limit(10);
   console.log('Should only see own company:', data);
   ```

## Additional Notes

- The RLS policies check for `users.role = 'developer'` using the authenticated user's ID
- Developers can view/edit data across all companies
- Regular users (company admins, ops managers, etc.) remain restricted to their own company
- The policies use `EXISTS` subqueries to check the user's role efficiently

## Troubleshooting

**If you still see errors after applying the fix:**

1. **Check user role:**
   ```sql
   SELECT user_id, email, role FROM users WHERE email = 'your-email@example.com';
   ```

2. **Check if policies exist:**
   ```sql
   SELECT schemaname, tablename, policyname, roles, cmd, qual
   FROM pg_policies
   WHERE tablename IN ('activity_log', 'companies', 'users', 'bookings')
   ORDER BY tablename, policyname;
   ```

3. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('activity_log', 'companies', 'users', 'bookings');
   ```

4. **Clear browser cache and re-login**

5. **Check Supabase logs** in Dashboard → Logs for detailed error messages
