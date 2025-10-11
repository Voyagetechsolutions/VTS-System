# Developer Dashboard - Final Setup & Connection Guide

## 🎯 Current Issue
The Developer Dashboard shows zeros for all metrics and "No data available" in tables because:
1. RLS policies are blocking developer access
2. No test data exists in the database
3. Developer user role not properly set

## ✅ Step-by-Step Fix

### Step 1: Run RLS Policies (CRITICAL)
Open Supabase SQL Editor and run:
```sql
-- File: Database/006_developer_rls_policies.sql
```
This creates policies that allow developers to bypass company-scoped restrictions.

### Step 2: Create Test Data
Open Supabase SQL Editor and run:
```sql
-- File: Database/007_verify_and_test_data.sql
```
This will:
- Verify all tables exist
- Create 5 test companies
- Create 6 test users
- Create 8 test buses
- Create 5 test routes
- Create 7 test bookings
- Create test payments
- Create 10 activity log entries
- Set up platform settings

### Step 3: Set Your User as Developer
```sql
-- Replace with your actual email
UPDATE users 
SET role = 'developer' 
WHERE email = 'your-email@example.com';
```

### Step 4: Verify Database Connection
Run this query to see what the dashboard should show:
```sql
SELECT 
    (SELECT COUNT(*) FROM companies WHERE is_active = true) AS active_companies,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM buses) AS total_buses,
    (SELECT SUM(amount) FROM payments WHERE status = 'completed') AS total_revenue_rands;
```

Expected results after test data:
- Active Companies: 5
- Total Users: 6
- Total Buses: 8
- Total Revenue: R980 (sum of all completed payments)

## 📊 What Each Section Shows

### Overview Tab (Main Dashboard)
**Top Cards:**
- **Active Companies**: Count from `companies` table where `is_active = true`
- **Total Users**: Count from `users` table
- **Active Buses**: Count from `buses` table
- **Total Revenue**: Sum of `amount` from `payments` table where `status = 'completed'`

**Recent Activity:**
- Shows last 10 entries from `activity_log` table
- Displays: timestamp, action type, company name, details
- Updates when: bookings created, buses added, users added, payments completed, etc.

**Quick Actions:**
- **Create Company**: Calls `createCompany()` → inserts into `companies` table
- **Manage Users**: Calls `createUser()` → inserts into `users` table
- **Send Announcement**: Calls `createAnnouncement()` → inserts into `announcements` table

### Companies Tab
**Data Source**: `companies` table via `getAllCompanies()`

**Columns Shown:**
- Company Name
- Status (Active/Inactive)
- Subscription Plan (Basic/Standard/Premium)
- Created Date

**Actions:**
- View: Shows company details
- Edit: Updates company info
- Suspend/Activate: Toggles `is_active` status

**Filters:**
- Search by Name
- Filter by Status
- Filter by Plan
- Date Range

### Users Tab
**Data Source**: `users` table via `getAllUsersGlobal()`

**Columns Shown:**
- Name
- Email
- Role (developer, admin, ops_manager, etc.)
- Company
- Status (Active/Inactive)
- Last Login

**Actions:**
- View: Shows user profile
- Edit: Updates user info
- Reset Password: Triggers password reset
- Deactivate: Sets `is_active = false`

**Filters:**
- Search by Name
- Search by Email
- Filter by Company
- Filter by Role
- Filter by Status
- Date Range

## 🔧 Troubleshooting

### Issue: Still showing zeros after running scripts

**Check 1: Verify data was created**
```sql
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM buses;
SELECT COUNT(*) FROM activity_log;
```

If counts are 0, the INSERT statements were skipped. Manually run the INSERT statements from `007_verify_and_test_data.sql`.

**Check 2: Verify RLS policies exist**
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE policyname ILIKE '%developer%'
ORDER BY tablename;
```

Should show policies like:
- `Developers can view all companies`
- `Developers can view all users`
- `Developers can view all activity logs`
- etc.

**Check 3: Verify your user has developer role**
```sql
SELECT user_id, name, email, role 
FROM users 
WHERE email = 'your-email@example.com';
```

Role should be 'developer' (lowercase).

**Check 4: Check browser console for errors**
Open Developer Tools (F12) → Console tab
Look for:
- 400 errors → RLS policies blocking
- 401 errors → Not authenticated
- Network errors → Connection issues

### Issue: "No data available" in tables

**Cause**: RLS policies are blocking the queries

**Fix**: 
1. Ensure RLS policies are created (Step 1)
2. Ensure your user has `role = 'developer'`
3. Clear browser cache and re-login
4. Check Supabase logs for detailed error messages

### Issue: Can't create companies/users

**Cause**: Missing INSERT policies for developers

**Fix**: Run this additional policy:
```sql
CREATE POLICY "Developers can insert companies"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.user_id = auth.uid()
    AND u.role = 'developer'
  )
);
```

## 📝 Activity Log Events

The `activity_log` table should capture these events:

| Event Type | When It Happens | Example Message |
|------------|----------------|-----------------|
| `booking_created` | New booking made | "New booking created for JHB to PTA route" |
| `booking_confirmed` | Booking confirmed | "Booking confirmed for passenger John Doe" |
| `booking_cancelled` | Booking cancelled | "Booking cancelled by passenger" |
| `payment_completed` | Payment successful | "Payment of R150 completed" |
| `payment_failed` | Payment failed | "Payment failed for booking BK12345" |
| `bus_added` | New bus added | "New bus ABC-123-GP added to fleet" |
| `bus_maintenance` | Bus maintenance | "Bus ABC-123-GP scheduled for maintenance" |
| `user_created` | New user added | "New user added: John Admin" |
| `user_login` | User logs in | "User john@company.com logged in" |
| `route_created` | New route added | "New route added: JHB to PTA Express" |
| `company_created` | New company added | "New company registered: ABC Transport" |

To add activity logs programmatically:
```javascript
// In your code when an action happens
await supabase.from('activity_log').insert([{
  type: 'booking_created',
  message: 'New booking created for route XYZ',
  company_id: companyId,
  created_at: new Date().toISOString()
}]);
```

## 🚀 Expected Results After Setup

### Overview Tab
- Active Companies: **5**
- Total Users: **6**
- Active Buses: **8**
- Total Revenue: **R980**
- Recent Activity: **10 entries** showing various actions

### Companies Tab
- **5 companies** listed:
  - ABC Transport Ltd (Premium)
  - XYZ Bus Services (Standard)
  - Quick Shuttle Co (Basic)
  - Metro Express (Premium)
  - Coastal Coaches (Standard)

### Users Tab
- **6 users** listed:
  - John Admin (ABC Transport Ltd)
  - Sarah Manager (XYZ Bus Services)
  - Mike Driver (Quick Shuttle Co)
  - Lisa Booking (Metro Express)
  - Tom Admin (Coastal Coaches)
  - Developer User (No company)

## ✅ Final Checklist

- [ ] RLS policies created (`006_developer_rls_policies.sql`)
- [ ] Test data created (`007_verify_and_test_data.sql`)
- [ ] Developer role assigned to your user
- [ ] Browser cache cleared and re-logged in
- [ ] Dashboard shows real numbers (not zeros)
- [ ] Companies tab shows 5 companies
- [ ] Users tab shows 6 users
- [ ] Recent Activity shows 10 entries
- [ ] Can create new company
- [ ] Can create new user
- [ ] Can send announcement

## 📞 Still Having Issues?

1. Check Supabase Dashboard → Logs for detailed error messages
2. Check browser console (F12) for JavaScript errors
3. Verify your Supabase URL and API key in `.env` file
4. Ensure you're logged in with a user that has `role = 'developer'`
5. Try disabling RLS temporarily to test: `ALTER TABLE companies DISABLE ROW LEVEL SECURITY;` (not recommended for production)
