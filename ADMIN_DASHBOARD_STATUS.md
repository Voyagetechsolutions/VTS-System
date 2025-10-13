# Admin Dashboard - Current Status & Database Requirements

## ✅ What's Already Implemented

### 1. Executive Overview (CommandCenterTab)
**Status:** ✅ Fully connected to real APIs

**APIs Used:**
- `getCompanyDashboardKPIs()` - Fetches active trips, passengers today, revenue today
- `getAdminOversightSnapshot()` - Fetches staff utilization
- `getLargeRefunds()` - Fetches pending refunds count
- `getOpenIncidentsCount()` - Fetches open incidents count
- `getCompanyAlertsFeed()` - Fetches recent activity logs

**Current Display:**
- Active Trips: 0
- Passengers Today: 0
- Revenue Today: R0
- Open Incidents: 0
- Refunds Pending: 0
- Staff Utilization: 0%

**Why Showing Zeros:**
The database tables (`trips`, `bookings`, `incidents`, `refunds`, `staff`) either don't exist or have no data.

---

### 2. Approvals & Oversight (ApprovalsTab)
**Status:** ✅ Fully connected to real APIs

**APIs Used:**
- `getPendingApprovals()` - Fetches all pending approvals
- `getLargeRefunds()` - Fetches large refunds requiring approval
- `getRouteRequests()` - Fetches route change requests
- `getMaintenanceRequests()` - Fetches major maintenance requests
- `getHRRequests()` - Fetches HR actions requiring approval
- `approveRequest(id, notes)` - Approves a request
- `rejectRequest(id, notes)` - Rejects a request

**Current Display:**
- All tables showing "No ... pending"

**Why Showing Empty:**
The database tables (`refunds`, `route_requests`, `maintenance_requests`, `hr_actions`) have no pending items.

---

### 3. Oversight Map (OversightMapTab)
**Status:** ✅ Fully connected to real APIs

**APIs Used:**
- `getOpsSnapshotFromViews()` - Primary data source (uses database views)
- `getAdminOversightSnapshot()` - Fallback data source

**Displays 9 Departments:**
1. **Booking Office** - Vol, Fraud, Refund approvals, Reconciliation
2. **Boarding** - Seat Utilization, Incidents, Delays
3. **Driver** - Completion %, Accidents, Safety violations, On-time score
4. **Operations** - Utilization, Pending route approvals, Dead mileage
5. **Depot** - Readiness, Staff shortages, Overtime, Buses down
6. **Maintenance** - Downtime %, Major jobs pending, Cost impact
7. **Finance** - P&L, High-risk refunds, Large expenses
8. **HR** - Turnover, Critical hires, Payroll adjustments
9. **Notifications** - Escalations, Broadcasts, Rules configured

**Why Showing Zeros:**
The snapshot APIs aggregate data from multiple tables. If those tables are empty, all metrics are zero.

---

## 🗄️ Database Tables Required

### Core Tables (Already Exist)
These tables should already exist from your schema:

1. **companies** - Company information
2. **users** - User accounts
3. **buses** - Fleet vehicles
4. **routes** - Bus routes
5. **drivers** - Driver information
6. **bookings** - Passenger bookings
7. **payments** - Payment transactions
8. **trips** - Active/completed trips
9. **activity_log** - System activity logs

### Tables That May Need Creation

#### For Executive Overview:
```sql
-- incidents table
CREATE TABLE IF NOT EXISTS incidents (
  incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  type VARCHAR(50), -- 'safety', 'service', 'maintenance', etc.
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'resolved', 'closed'
  description TEXT,
  reported_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- refunds table (if not exists)
CREATE TABLE IF NOT EXISTS refunds (
  refund_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(booking_id),
  amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  reason TEXT,
  requested_by UUID REFERENCES users(user_id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- staff table (if not exists)
CREATE TABLE IF NOT EXISTS staff (
  staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  user_id UUID REFERENCES users(user_id),
  role VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'on_leave'
  shift_start TIME,
  shift_end TIME
);
```

#### For Approvals & Oversight:
```sql
-- route_requests table
CREATE TABLE IF NOT EXISTS route_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(company_id),
  route_name VARCHAR(255),
  origin VARCHAR(255),
  destination VARCHAR(255),
  requested_by UUID REFERENCES users(user_id),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(bus_id),
  issue TEXT,
  priority VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  estimated_cost DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  requested_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- hr_actions table
CREATE TABLE IF NOT EXISTS hr_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(user_id),
  action_type VARCHAR(50), -- 'leave_request', 'promotion', 'termination', etc.
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  requested_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### For Oversight Map:
The Oversight Map uses aggregated views. You may need to create database views or RPC functions:

```sql
-- Example: Create a view for booking office metrics
CREATE OR REPLACE VIEW booking_office_metrics AS
SELECT
  company_id,
  COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as volume_today,
  COUNT(*) FILTER (WHERE fraud_flag = true) as fraud_alerts,
  COUNT(*) FILTER (WHERE status = 'pending' AND amount > 1000) as large_refunds_pending
FROM bookings
GROUP BY company_id;
```

---

## 🔧 What Needs to Be Done

### Option 1: Create Missing Tables (Recommended)
Run SQL scripts to create the missing tables listed above. This will allow the dashboard to function properly.

### Option 2: Verify Existing Tables
Some tables may already exist but with different column names. Check your current schema:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check specific table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'incidents';
```

### Option 3: Add Test Data
Once tables exist, add test data to verify the dashboard displays correctly:

```sql
-- Example: Add test incidents
INSERT INTO incidents (company_id, type, status, description)
VALUES 
  ((SELECT company_id FROM companies LIMIT 1), 'safety', 'open', 'Test incident 1'),
  ((SELECT company_id FROM companies LIMIT 1), 'service', 'open', 'Test incident 2');

-- Example: Add test refunds
INSERT INTO refunds (booking_id, amount, status, reason)
SELECT 
  booking_id, 
  500.00, 
  'pending', 
  'Customer requested refund'
FROM bookings 
LIMIT 3;
```

---

## 📊 Summary

| Component | Status | Issue | Fix |
|-----------|--------|-------|-----|
| Executive Overview | ✅ Connected | Shows zeros | Add data to `trips`, `bookings`, `incidents`, `refunds` |
| Approvals & Oversight | ✅ Connected | Shows "No data" | Add data to `refunds`, `route_requests`, `maintenance_requests`, `hr_actions` |
| Oversight Map | ✅ Connected | Shows zeros | Create views or add data to source tables |
| Global Communications | ✅ Connected | - | Already working |
| Live Map Buses | ✅ Connected | - | Already working |

**All admin dashboard tabs are properly connected to Supabase APIs. The issue is purely data-related, not code-related.**

---

## 🚀 Next Steps

1. **Verify which tables exist** in your Supabase database
2. **Create missing tables** using the SQL scripts above
3. **Add test data** to verify the dashboard displays correctly
4. **Check RLS policies** to ensure your admin user can access the data
5. **Refresh the dashboard** to see the data populate

Would you like me to create SQL scripts to set up all the missing tables and add test data?
