# 🚀 VTS Admin System Setup Guide

Your Supabase credentials have been configured! Follow these steps to set up the complete admin system.

## 📋 Your Supabase Configuration

```
URL: https://vtfxizyghgvxnllnapyi.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnhpenlnaGd2eG5sbG5hcHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDgxNDEsImV4cCI6MjA3MTg4NDE0MX0.wFXRm16eLQYYDO_d4SvOdpH3VSE9nCPIQxnNQ9Bd4Gc
```

## 🔧 Step 1: Test Your Connection

First, let's verify your Supabase connection works:

```bash
cd "c:\VTS system\Database\admin"
node test_connection.js
```

This will test your connection and show you what tables already exist.

## 🗄️ Step 2: Set Up Admin Database

You need to execute the SQL files in your Supabase Dashboard. Here's how:

### Option A: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `vtfxizyghgvxnllnapyi`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute SQL Files in Order**

   **File 1: Core Tables**
   ```sql
   -- Copy and paste the entire content of 01_admin_tables.sql
   -- Then click "Run"
   ```

   **File 2: Functions**
   ```sql
   -- Copy and paste the entire content of 02_admin_functions.sql
   -- Then click "Run"
   ```

   **File 3: Security Policies**
   ```sql
   -- Copy and paste the entire content of 04_admin_rls_policies.sql
   -- Then click "Run"
   ```

   **File 4: Setup & Sample Data**
   ```sql
   -- Copy and paste the entire content of 06_setup_admin_system.sql
   -- Then click "Run"
   ```

### Option B: Command Line (Alternative)

If you have PostgreSQL client installed:

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR_PASSWORD]@db.vtfxizyghgvxnllnapyi.supabase.co:5432/postgres"

# Execute files in order
\i 01_admin_tables.sql
\i 02_admin_functions.sql
\i 04_admin_rls_policies.sql
\i 06_setup_admin_system.sql
```

## 👤 Step 3: Default Admin Accounts

After running the setup, you'll have these accounts:

### Super Admin
- **Email:** `admin@vtssystem.com`
- **Password:** `VTS@Admin2024!`
- **Access:** Full system access

### Sample Company Admin
- **Email:** `admin@metrobuslines.com`
- **Password:** `Metro@2024!`
- **Company:** Metro Bus Lines
- **Access:** Company-specific access

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

## 🔗 Step 4: Frontend Integration

The admin API has been copied to your frontend:
```
✅ adminApi.js → Frontend/src/supabase/adminApi.js
```

### Update Your Components

```javascript
// Import the admin API
import { 
  adminAuth, 
  adminCompanyAPI, 
  adminBookingAPI, 
  adminFinancialAPI 
} from '../supabase/adminApi';

// Example: Login
const handleLogin = async (email, password) => {
  try {
    const user = await adminAuth.login(email, password);
    console.log('Logged in:', user);
    // Redirect to dashboard
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Example: Get dashboard metrics
const loadDashboard = async () => {
  try {
    const companyId = localStorage.getItem('companyId');
    const metrics = await adminCompanyAPI.getDashboardMetrics(companyId);
    console.log('Dashboard metrics:', metrics);
  } catch (error) {
    console.error('Failed to load metrics:', error);
  }
};
```

## 🧪 Step 5: Test Admin Functionality

### Test Login
```javascript
import { adminAuth } from '../supabase/adminApi';

// Test super admin login
const testLogin = async () => {
  try {
    const user = await adminAuth.login('admin@vtssystem.com', 'VTS@Admin2024!');
    console.log('Super admin login successful:', user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Test Company Data
```javascript
import { adminCompanyAPI } from '../supabase/adminApi';

// Test company metrics
const testMetrics = async () => {
  try {
    const companyId = 'your-company-id'; // Get from login response
    const metrics = await adminCompanyAPI.getDashboardMetrics(companyId);
    console.log('Company metrics:', metrics);
  } catch (error) {
    console.error('Metrics failed:', error);
  }
};
```

## 🔒 Step 6: Security Configuration

### Environment Variables
Make sure your `.env` file has:
```env
REACT_APP_SUPABASE_URL=https://vtfxizyghgvxnllnapyi.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnhpenlnaGd2eG5sbG5hcHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDgxNDEsImV4cCI6MjA3MTg4NDE0MX0.wFXRm16eLQYYDO_d4SvOdpH3VSE9nCPIQxnNQ9Bd4Gc
```

### Row Level Security
The setup automatically enables RLS policies that:
- Isolate company data
- Restrict admin access by role
- Log all admin activities
- Secure sensitive operations

## 📊 Step 7: Available Features

After setup, you'll have access to:

### Dashboard Features
- **Company Metrics:** Revenue, bookings, fleet status
- **Financial Reports:** Revenue by date/route, expense tracking
- **Booking Management:** Search, filter, create, cancel bookings
- **Fleet Management:** Bus status, driver coordination, maintenance
- **Staff Management:** Employee records, shifts, attendance
- **Audit Trail:** Complete activity logging

### API Functions
- **Authentication:** Login, session management, permissions
- **Company Management:** Metrics, details, updates
- **Booking Operations:** CRUD with advanced filtering
- **Financial Reporting:** Revenue and expense analytics
- **Fleet Operations:** Bus, driver, trip management
- **Staff Coordination:** Employee and shift management
- **Audit Logging:** Activity tracking and reporting

## 🐛 Troubleshooting

### Common Issues

1. **SQL Execution Errors**
   - Make sure to execute files in the correct order
   - Check for syntax errors in the Supabase SQL editor
   - Verify you have the necessary permissions

2. **Connection Issues**
   - Verify your Supabase URL and key are correct
   - Check if your project is active in Supabase dashboard
   - Test connection with the test script

3. **Login Issues**
   - Ensure admin tables were created successfully
   - Check if the setup script ran completely
   - Verify default users were created

4. **Permission Errors**
   - Make sure RLS policies were applied
   - Check if the user has the correct role
   - Verify company_id is set correctly

### Debug Steps
1. Run the connection test: `node test_connection.js`
2. Check Supabase logs in the dashboard
3. Verify table creation in the Table Editor
4. Test API calls in the browser console

## 🎉 Success Indicators

You'll know the setup is successful when:
- ✅ Connection test passes
- ✅ All admin tables are created
- ✅ Default admin users exist
- ✅ Login returns user data with session token
- ✅ Dashboard metrics load correctly
- ✅ Company data is accessible

## 📞 Next Steps

1. **Change Default Passwords**
2. **Create Your Company Admin Users**
3. **Import Your Existing Data**
4. **Configure Company Settings**
5. **Test All Dashboard Features**
6. **Set Up User Roles and Permissions**

---

**Need Help?** Check the README.md file for detailed API documentation and examples.
