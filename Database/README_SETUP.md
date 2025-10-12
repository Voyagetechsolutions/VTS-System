# Database Setup Instructions

## Quick Start

To set up the Developer Dashboard with all features working, run these SQL scripts in your Supabase SQL Editor **in order**:

### 1. Fix Subscriptions Table Schema
**File:** `Database/017_fix_subscriptions_schema.sql` ⚠️ **RUN THIS FIRST**

This script will:
- Create the `subscriptions` table
- Add indexes for performance
- Enable Row Level Security (RLS)
- Create RLS policies for developers
- Insert test subscription data for all existing companies

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `017_fix_subscriptions_schema.sql`
3. Paste and click "Run"
4. Verify: You should see "Success. No rows returned" or similar

### 2. Fix Platform Settings and Announcements
**File:** `018_fix_platform_settings_and_announcements.sql` ⚠️ **RUN THIS SECOND**

This script will:
- Create the `platform_settings` table with correct schema
- Add default platform settings
- Add missing columns to `announcements` table (`created_by`, `status`, `sent_at`, etc.)
- Create RLS policies for both tables

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `018_fix_platform_settings_and_announcements.sql`
3. Paste and click "Run"
4. Verify: You should see "Success. No rows returned" or similar

### 3. Verify Data

Run this query to check if subscriptions were created:

```sql
SELECT 
  s.id,
  s.subscription_id,
  c.name as company_name,
  s.plan,
  s.status,
  s.amount,
  s.next_billing_date
FROM subscriptions s
JOIN companies c ON s.company_id = c.company_id
ORDER BY s.created_at DESC;
```

You should see one subscription per company.

## What This Enables

After running the setup:

✅ **Billing & Subscriptions Tab** - View all company subscriptions, plans, and payment dates
✅ **Suspend/Activate Companies** - Control company access with one click
✅ **Bookings & Transactions Tab** - View all bookings and payment transactions
✅ **Settings Page** - Save platform settings to database
✅ **Announcements Page** - Create and send announcements

## Troubleshooting

### Issue: "relation 'subscriptions' already exists"
**Solution:** The table already exists. You can skip this script or drop it first:
```sql
DROP TABLE IF EXISTS subscriptions CASCADE;
```
Then run the script again.

### Issue: "permission denied for table subscriptions"
**Solution:** Make sure you're logged in as a developer user. Run:
```sql
-- Check your user role
SELECT role FROM users WHERE auth_user_id = auth.uid();

-- If not 'developer', update it:
UPDATE users SET role = 'developer' WHERE auth_user_id = auth.uid();
```

### Issue: No data showing in dashboard
**Solution:** 
1. Check if RLS is properly configured
2. Verify your user has `role = 'developer'`
3. Check browser console for API errors
4. Verify the `auth_user_id` is set correctly:
```sql
SELECT user_id, name, email, role, auth_user_id 
FROM users 
WHERE email = 'your-email@example.com';
```

## Additional Scripts (Already Run)

If you're setting up from scratch, you may also need:
- `001_initial_schema.sql` - Base tables
- `006_developer_rls_policies.sql` - Developer access policies
- `012_FINAL_test_data.sql` - Test data for all tables
- `015_link_auth_to_users.sql` - Link Supabase auth to users table

## Verification Checklist

After setup, verify these work in the Developer Dashboard:

- [ ] Billing & Subscriptions tab shows companies with plans
- [ ] Can suspend/activate companies
- [ ] Bookings & Transactions tab shows data
- [ ] Settings page saves changes
- [ ] Announcements page creates and sends announcements
- [ ] All KPI cards show correct numbers
- [ ] Activity log displays recent actions

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs for API errors
3. Verify RLS policies are enabled
4. Ensure your user role is 'developer'
