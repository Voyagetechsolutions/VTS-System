# VTS Admin System Database Setup

This folder contains the complete database structure and API integration for the VTS Admin Dashboard system.

## 📁 File Structure

```
admin/
├── 01_admin_tables.sql          # Core database tables and indexes
├── 02_admin_functions.sql       # PostgreSQL functions for admin operations
├── 03_admin_edge_functions.sql  # Supabase Edge Functions (TypeScript code)
├── 04_admin_rls_policies.sql    # Row Level Security policies
├── 05_admin_api_integration.js  # Original API integration (reference)
├── 06_setup_admin_system.sql    # Complete setup script with sample data
├── adminApi.js                  # Frontend API integration (use this)
└── README.md                    # This file
```

## 🚀 Setup Instructions

### 1. Database Setup

Execute the SQL files in order:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres

# Execute files in order:
\i 01_admin_tables.sql
\i 02_admin_functions.sql
\i 04_admin_rls_policies.sql
\i 06_setup_admin_system.sql
```

### 2. Edge Functions Setup (Optional)

The edge functions in `03_admin_edge_functions.sql` are provided as reference. The system works with direct database calls through the adminApi.js file.

If you want to use edge functions:

1. Create the functions in your Supabase dashboard
2. Copy the TypeScript code from the SQL comments
3. Deploy the functions

### 3. Frontend Integration

Copy the `adminApi.js` file to your frontend:

```bash
cp adminApi.js ../../../Frontend/src/supabase/adminApi.js
```

### 4. Update Your Components

Import and use the admin API in your components:

```javascript
import { 
  adminAuth, 
  adminCompanyAPI, 
  adminBookingAPI, 
  adminFinancialAPI,
  adminFleetAPI,
  adminStaffAPI,
  adminAuditAPI,
  adminUtils
} from '../supabase/adminApi';

// Example usage:
const metrics = await adminCompanyAPI.getDashboardMetrics(companyId);
const bookings = await adminBookingAPI.getBookings(companyId, { status: 'confirmed' });
```

## 🔐 Default Credentials

After running the setup script, you'll have these default accounts:

### Super Admin
- **Email:** admin@vtssystem.com
- **Password:** VTS@Admin2024!
- **Permissions:** Full system access

### Sample Company Admin
- **Email:** admin@metrobuslines.com
- **Password:** Metro@2024!
- **Company:** Metro Bus Lines
- **Permissions:** Company-specific access

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

## 📊 Database Schema Overview

### Core Admin Tables
- `admin_users` - Admin user accounts
- `admin_sessions` - Session management
- `admin_activity_log` - Audit trail

### Enhanced Business Tables
- `companies` - Company information
- `company_branches` - Branch management
- `staff` - Employee records
- `staff_shifts` - Shift scheduling
- `staff_attendance` - Attendance tracking
- `buses` - Fleet management
- `maintenance_logs` - Maintenance records
- `fuel_logs` - Fuel tracking
- `routes` - Route definitions
- `trips` - Trip scheduling
- `bookings` - Booking management
- `payments` - Payment processing
- `expenses` - Expense tracking
- `expense_categories` - Expense categorization

### Views for Reporting
- `admin_booking_details` - Enhanced booking view
- `admin_trip_details` - Enhanced trip view
- `admin_financial_summary` - Financial metrics view

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Company-based data isolation
- Role-based access control
- Admin session validation

### Audit Trail
- Automatic activity logging
- Comprehensive audit functions
- IP address and user agent tracking

### Permission System
- Role-based permissions
- Granular permission control
- Super admin override capabilities

## 🛠️ API Functions

### Authentication
- `adminAuth.login(email, password)`
- `adminAuth.validateSession()`
- `adminAuth.logout()`
- `adminAuth.getCurrentUser()`

### Company Management
- `adminCompanyAPI.getDashboardMetrics(companyId)`
- `adminCompanyAPI.getCompanyDetails(companyId)`
- `adminCompanyAPI.updateCompany(companyId, updates)`

### Booking Management
- `adminBookingAPI.getBookings(companyId, options)`
- `adminBookingAPI.createBooking(companyId, bookingData)`
- `adminBookingAPI.cancelBooking(bookingId, companyId)`
- `adminBookingAPI.updateBooking(bookingId, updates)`

### Financial Management
- `adminFinancialAPI.getRevenueByDateRange(companyId, startDate, endDate)`
- `adminFinancialAPI.getRevenueByRoute(companyId, startDate, endDate)`
- `adminFinancialAPI.getExpensesByCategory(companyId, startDate, endDate)`
- `adminFinancialAPI.getPayments(companyId, options)`
- `adminFinancialAPI.getExpenses(companyId, options)`

### Fleet Management
- `adminFleetAPI.getBuses(companyId, options)`
- `adminFleetAPI.getDrivers(companyId, options)`
- `adminFleetAPI.getTrips(companyId, options)`
- `adminFleetAPI.getMaintenanceLogs(companyId, options)`
- `adminFleetAPI.getFuelLogs(companyId, options)`

### Staff Management
- `adminStaffAPI.getStaff(companyId, options)`
- `adminStaffAPI.getStaffShifts(companyId, options)`
- `adminStaffAPI.getStaffAttendance(companyId, options)`

### Audit Trail
- `adminAuditAPI.getAuditLogs(companyId, options)`
- `adminAuditAPI.logActivity(companyId, activityData)`

## 🎯 Integration with Existing System

The admin system is designed to work alongside your existing VTS system:

### Shared Tables
- Uses existing `companies`, `staff`, `buses`, `routes`, `trips`, `bookings` tables
- Enhances them with additional admin-specific fields
- Maintains backward compatibility

### Enhanced Features
- Advanced filtering and search
- Comprehensive audit logging
- Role-based access control
- Financial reporting and analytics

### Dashboard Integration
- Removed depot operations pages as requested
- Integrated Finance Center functionality
- Enhanced booking and fleet management
- Added comprehensive reporting capabilities

## 🔧 Customization

### Adding New Permissions
1. Update the `admin_users.permissions` JSONB field
2. Add permission checks in `adminUtils.hasPermission()`
3. Implement permission-based UI controls

### Adding New Audit Events
1. Use `adminAuditAPI.logActivity()` in your components
2. Automatic logging is enabled for database changes
3. Custom events can be logged manually

### Extending Financial Reports
1. Add new functions in `02_admin_functions.sql`
2. Create corresponding API methods in `adminApi.js`
3. Implement UI components for new reports

## 📈 Performance Considerations

### Indexes
- Comprehensive indexing for all major queries
- Composite indexes for common filter combinations
- Performance-optimized for large datasets

### Views
- Pre-computed views for complex queries
- Reduced join complexity in frontend
- Cached financial summaries

### Pagination
- Built-in pagination support
- Configurable page sizes
- Efficient offset-based pagination

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check RLS policies
   - Verify admin session is valid
   - Ensure user has required permissions

2. **Company Data Not Showing**
   - Verify `companyId` is set correctly
   - Check `adminUtils.canAccessCompany(companyId)`
   - Ensure user belongs to the company

3. **Session Expired**
   - Call `adminAuth.validateSession()`
   - Handle logout and redirect to login
   - Check session token expiration

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('admin_debug', 'true');
```

## 📞 Support

For issues or questions:
1. Check the audit logs for error details
2. Verify database permissions and RLS policies
3. Test with the sample data provided
4. Review the API integration examples

---

**Last Updated:** October 2024  
**Version:** 1.0.0  
**Compatibility:** Supabase PostgreSQL 15+
