# Login Troubleshooting Guide

## 🔍 Issue: "No active user with that email"

You're getting this error because of several configuration issues that have now been fixed.

## ✅ What I Fixed

1. **Schema Mismatch**: The login code was looking for `id` field but the database uses `user_id`
2. **Missing Environment File**: Created `.env.local` file with proper structure
3. **Password Verification**: Added proper password checking logic
4. **Updated Seed Data**: Added comprehensive test users with proper credentials

## 🚀 Next Steps

### 1. Update Supabase Credentials

You need to update the `.env.local` file in the Frontend directory with your actual Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-actual-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key
```

**To get these credentials:**
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" and "anon public" key

### 2. Run the Seed Data

You need to run the updated seed data in your Supabase database. You can do this through:

1. **Supabase Dashboard**: Go to SQL Editor and run the contents of `Supabase/seed.sql`
2. **Or use the Supabase CLI** if you have it installed

### 3. Test Login

After updating credentials and running seed data, you can test with these credentials:

**Developer Account:**
- Email: `dev@alpha.com`
- Password: `password123`
- Role: `developer`

**Admin Account:**
- Email: `admin@alpha.com`
- Password: `password123`
- Role: `admin`

**Booking Officer:**
- Email: `booking@alpha.com`
- Password: `password123`
- Role: `booking_officer`

## 🔧 Common Issues & Solutions

### Issue: "Invalid Supabase URL"
**Solution**: Make sure your `REACT_APP_SUPABASE_URL` starts with `https://` and ends with `.supabase.co`

### Issue: "Invalid API key"
**Solution**: Use the "anon public" key, not the "service_role" key

### Issue: "No active user found"
**Solution**: 
1. Check that you've run the seed data
2. Verify the email exists in your Supabase users table
3. Ensure the user has `is_active = true`

### Issue: "Invalid password"
**Solution**: Use `password123` for all test accounts

## 📋 Verification Checklist

- [ ] Updated `.env.local` with correct Supabase credentials
- [ ] Ran seed data in Supabase database
- [ ] Frontend is running on `http://localhost:3000`
- [ ] Backend is running on `http://localhost:5000`
- [ ] Can access the login page
- [ ] Test login with provided credentials works

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: See if API calls are failing
3. **Verify Supabase Connection**: Test if you can query your database directly
4. **Check Environment Variables**: Ensure they're being loaded correctly

## 🔐 Security Note

The current implementation uses plain text passwords for demo purposes. In production, you should:
- Hash passwords using bcrypt or similar
- Use Supabase Auth for proper authentication
- Implement proper session management
- Add rate limiting for login attempts
