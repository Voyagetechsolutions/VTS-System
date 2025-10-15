# 📝 **VTS System - Create Forms Inventory**

## **Complete List of All Create/Add Forms in the System**

### **🏢 Company Management**
1. **Create Company** - `components/tabs/OverviewTab.jsx`
2. **Create Company** - `components/developer/tabs/CompaniesDevTab.jsx`
3. **Create Company** - `components/developer/tabs/DevOverviewTab.jsx`

### **👥 User & Staff Management**
4. **Add User** - `components/companyAdmin/tabs/UsersTab.jsx`
5. **Add Employee** - `components/hr/tabs/HROverviewTab.jsx`
6. **Add Staff** - `components/maintenanceManager/tabs/CommandCenterTab.jsx`
7. **Add Driver** - `components/operationsManager/tabs/StaffTab.jsx`
8. **Add Driver** - `components/companyAdmin/tabs/DriverHubTab.jsx`

### **🚌 Fleet Management**
9. **Add Bus** - `components/companyAdmin/tabs/FleetTab.jsx`
10. **Add Bus** - `components/operationsManager/tabs/FleetTab.jsx`
11. **Add Bus to Route** - `components/companyAdmin/tabs/CommandCenterTab.jsx`

### **🛣️ Routes & Scheduling**
12. **Add Route** - `components/companyAdmin/tabs/RoutesTab.jsx`
13. **Create Route** - `components/companyAdmin/tabs/CommandCenterTab.jsx`
14. **Add Schedule** - `components/companyAdmin/tabs/TripSchedulingTab.jsx`
15. **Add Shift** - `components/companyAdmin/tabs/DriverHubTab.jsx`

### **🎫 Bookings & Customers**
16. **Add Booking** - `components/companyAdmin/tabs/BookingsTab.jsx`
17. **Create Booking** - `components/hr/tabs/HROverviewTab.jsx`
18. **Add Customer** - `components/companyAdmin/tabs/CustomerHubTab.jsx`
19. **Create Refund** - `components/companyAdmin/tabs/CustomerTab.jsx`

### **📋 HR & Attendance**
20. **Add Attendance Entry** - `components/hr/tabs/AttendanceTab.jsx`
21. **Add Leave Request** - `components/hr/tabs/LeavesTab.jsx`
22. **Add Job Posting** - `components/hr/tabs/JobPostingsTab.jsx`
23. **Add Application** - `components/hr/tabs/ApplicationsTab.jsx`
24. **Add Compliance Document** - `components/hr/tabs/ComplianceTab.jsx`

### **🔧 Maintenance & Inventory**
25. **Add Stock** - `components/maintenanceManager/tabs/InventoryTab.jsx`
26. **Quick Add Usage** - `components/maintenanceManager/tabs/InventoryTab.jsx`
27. **Add Procurement** - `components/maintenanceManager/tabs/InventoryTab.jsx`

### **📊 Operations & Tasks**
28. **Add Task** - `components/operationsManager/tabs/DailyTasksTab.jsx`
29. **Add Complaint** - `components/companyAdmin/tabs/CustomerTab.jsx`

### **🏢 Branch Management**
30. **Create Branch** - `components/companyAdmin/tabs/BranchesTab.jsx`

### **⚖️ Compliance & Safety**
31. **Add Rule** - `components/tabs/ComplianceSafetyTab.jsx`

---

## **📊 Summary by Category:**

| Category | Count | Forms |
|----------|-------|-------|
| **Company Management** | 3 | Company creation across different modules |
| **User & Staff** | 5 | Users, employees, staff, drivers |
| **Fleet Management** | 3 | Buses and fleet operations |
| **Routes & Scheduling** | 4 | Routes, schedules, shifts |
| **Bookings & Customers** | 4 | Bookings, customers, refunds |
| **HR & Attendance** | 5 | Attendance, leaves, jobs, compliance |
| **Maintenance** | 3 | Inventory, stock, procurement |
| **Operations** | 2 | Tasks and complaints |
| **Infrastructure** | 2 | Branches and compliance rules |

**Total Create Forms: 31**

---

## **🗄️ Database Tables Needed:**

Based on these forms, the following database tables should be created/updated:

### **Core Tables:**
- `companies` - Company information
- `users` - System users
- `employees` - Employee records
- `drivers` - Driver-specific data
- `buses` - Fleet vehicles
- `routes` - Route definitions
- `schedules` - Trip schedules
- `shifts` - Work shifts
- `bookings` - Ticket bookings
- `customers` - Customer information
- `branches` - Company branches

### **HR Tables:**
- `attendance` - Attendance records
- `leave_requests` - Leave applications
- `job_postings` - Job advertisements
- `applications` - Job applications
- `compliance_documents` - Compliance records

### **Operations Tables:**
- `daily_tasks` - Task management
- `complaints` - Customer complaints
- `refunds` - Refund requests
- `inventory` - Stock management
- `procurement` - Purchase orders
- `usage_logs` - Inventory usage

### **Compliance Tables:**
- `safety_rules` - Safety regulations
- `compliance_checks` - Compliance monitoring

---

## **🔄 Next Steps:**
1. ✅ **UI Scaling Fixed** - Layout and spacing improved
2. 🔄 **Database Schema Update** - Create/update tables for all forms
3. 🔄 **API Endpoints** - Ensure all forms have corresponding backend APIs
4. 🔄 **Validation** - Add proper form validation
5. 🔄 **Testing** - Test all create forms functionality

---

**Note:** This inventory covers all create/add forms found in the current codebase. Each form should have corresponding database tables and API endpoints for full functionality.
