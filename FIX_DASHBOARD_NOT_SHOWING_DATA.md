# 🔧 Fix: Developer Dashboard Not Showing Data

## 🎯 Problem
The Developer Dashboard shows zeros for all metrics even though test data was created successfully.

## 🔍 Root Cause
**Row Level Security (RLS) policies** are blocking the queries. The frontend can't access data because:
1. RLS policies require a `role = 'developer'` check
2. Your user doesn't have the developer role set
3. OR the RLS policies weren't created

---

## ✅ SOLUTION - Follow These Steps IN ORDER:

### **Step 1: Run Diagnostic Script** 📊
**File**: `Database/013_diagnose_connection.sql`

This will show you:
- ✅ If test data exists
- ✅ If RLS is enabled
- ✅ If developer policies exist
- ✅ Your current user role

**Run it and check the output:**
- If data counts are > 0 but dashboard shows 0 → RLS is blocking
- If no developer policies found → Need to run Step 2
- If your role is not 'developer' → Need to run Step 3

---

### **Step 2: Apply RLS Policies** 🔐
**File**: `Database/006_developer_rls_policies.sql`

This creates policies that allow developers to bypass company restrictions.

**Run this script in Supabase SQL Editor**

Expected output:
```
✓ Policies dropped (if existed)
✓ 20+ policies created
✓ No errors
```

---

### **Step 3: Set Your User as Developer** 👤

**CRITICAL**: Replace `your-email@example.com` with your ACTUAL email!

```sql
-- Find your email first
SELECT user_id, name, email, role FROM users WHERE email ILIKE '%your-name%';

-- Then set developer role
UPDATE users 
SET role = 'developer' 
WHERE email = 'your-actual-email@example.com';

-- Verify it worked
SELECT user_id, name, email, role FROM users WHERE role = 'developer';
```

---

### **Step 4: Clear Browser Cache & Re-login** 🔄

1. **Open Developer Tools** (F12)
2. **Application tab** → Clear Storage → Clear site data
3. **Close browser completely**
4. **Re-open and login again**
5. **Navigate to Developer Dashboard**

---

### **Step 5: Check Browser Console** 🐛

Open Developer Tools (F12) → Console tab

**Look for these errors:**

#### ❌ **If you see 400 errors:**
```
Failed to load resource: 400 (Bad Request)
company_id=eq.null
```
**Fix**: RLS policies not applied → Go back to Step 2

#### ❌ **If you see 401 errors:**
```
Failed to load resource: 401 (Unauthorized)
```
**Fix**: Not logged in or session expired → Re-login

#### ❌ **If you see "Cannot read properties of undefined":**
```
Cannot read properties of undefined (reading 'company_id')
```
**Fix**: Already fixed in latest code, pull from GitHub

---

## 🎯 Expected Results After Fix:

### **Developer Dashboard Should Show:**
```
Active Companies: 5
Total Users: 6
Active Buses: 8
Total Revenue: R980
```

### **Recent Activity Should Show:**
```
✓ New booking created for JHB to PTA route
✓ New bus ABC-123-GP added to fleet
✓ User john.admin logged in
✓ Payment of R150 completed
... (10 entries total)
```

### **Companies Tab Should Show:**
```
✓ ABC Transport Ltd (Premium)
✓ XYZ Bus Services (Standard)
✓ Quick Shuttle Co (Basic)
✓ Metro Express (Premium)
✓ Coastal Coaches (Standard)
```

---

## 🔍 Still Not Working? Advanced Troubleshooting:

### **Test 1: Direct Database Query**
Run this in Supabase SQL Editor:
```sql
-- This should return 5
SELECT COUNT(*) FROM companies WHERE is_active = true;

-- This should return 6
SELECT COUNT(*) FROM users;

-- This should return 8
SELECT COUNT(*) FROM buses;
```

If these return 0, test data wasn't created → Re-run `012_FINAL_test_data.sql`

### **Test 2: Check Supabase Connection**
In browser console:
```javascript
// Test connection
const { data, error } = await supabase.from('companies').select('*').limit(1);
console.log('Companies:', data, error);
```

If error shows "RLS" or "policy" → RLS blocking access

### **Test 3: Temporarily Disable RLS (Testing Only!)**
```sql
-- ONLY FOR TESTING - DO NOT USE IN PRODUCTION
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE buses DISABLE ROW LEVEL SECURITY;

-- Test if dashboard works now
-- If yes, RLS was the problem

-- RE-ENABLE RLS AFTER TESTING:
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Checklist - Complete ALL Steps:

- [ ] Run `013_diagnose_connection.sql` - Check if data exists
- [ ] Run `006_developer_rls_policies.sql` - Create RLS policies
- [ ] Run `UPDATE users SET role = 'developer'` - Set your role
- [ ] Clear browser cache and re-login
- [ ] Check browser console for errors
- [ ] Verify dashboard shows real numbers
- [ ] Test creating a new company
- [ ] Test creating a new user

---

## 🆘 If Still Not Working:

1. **Share the output** from `013_diagnose_connection.sql`
2. **Share browser console errors** (F12 → Console tab)
3. **Share Supabase logs** (Dashboard → Logs)
4. **Confirm your user email** and role

---

## 💡 Common Mistakes:

1. ❌ Not setting your actual email in the UPDATE query
2. ❌ Not re-logging in after setting developer role
3. ❌ Not clearing browser cache
4. ❌ Running old cached SQL scripts
5. ❌ Not applying RLS policies

---

## ✅ Success Indicators:

When everything works, you should see:
- ✅ No 400/401 errors in browser console
- ✅ Real numbers on dashboard (not zeros)
- ✅ Recent Activity showing 10 entries
- ✅ Companies list showing 5 companies
- ✅ Users list showing 6 users
- ✅ Can create new companies/users

🎉 **Your Developer Dashboard is now fully connected to the database!**
