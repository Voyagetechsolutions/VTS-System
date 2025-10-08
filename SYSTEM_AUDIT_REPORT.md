# VTS System - Comprehensive Audit Report
**Date:** 2025-10-02  
**Auditor:** System Analysis  

---

## Executive Summary

This report documents bugs, potential issues, and unimplemented functions found across the VTS (Voyage Tech Solutions) Bus Management System. Issues are categorized by severity: **Critical**, **Medium**, and **Minor**.

---

## 🔴 CRITICAL ISSUES

### 1. **JWT Authentication Not Configured**
- **Location:** `Backend/Program.cs` (Lines 52-56)
- **Issue:** JWT authentication scheme is registered but NOT configured with actual JWT bearer options
- **Impact:** Authentication will fail in production; no token validation occurs
- **Current Code:**
```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "Bearer";
    options.DefaultChallengeScheme = "Bearer";
});
```
- **Missing:** `.AddJwtBearer()` configuration with secret key, issuer, audience validation
- **Fix Required:** Add proper JWT configuration using settings from `appsettings.json`

### 2. **CORS Policy Allows Any Origin**
- **Location:** `Backend/Program.cs` (Lines 21-29)
- **Issue:** Production system uses `AllowAnyOrigin()` which is a security vulnerability
- **Impact:** Any website can make requests to your API (CSRF attacks, data theft)
- **Code:**
```csharp
policy.AllowAnyOrigin()
      .AllowAnyMethod()
      .AllowAnyHeader();
```
- **Fix Required:** Restrict to specific origins in production

### 3. **Database Seeding Disabled**
- **Location:** `Backend/Program.cs` (Lines 84-92)
- **Issue:** Database seeding is commented out due to "connection issues"
- **Impact:** No initial data, system may not work for new deployments
- **Fix Required:** Resolve connection issues and enable seeding

### 4. **Hardcoded Credentials in Configuration**
- **Location:** `Backend/appsettings.json`
- **Issue:** Contains placeholder secrets that may be committed to version control
- **Examples:**
  - `"Password=yourpassword"` (Line 3)
  - `"SecretKey": "your-super-secret-key-here-make-it-long-and-secure"` (Line 18)
  - Stripe and PayGate keys are placeholders
- **Impact:** Security breach if real credentials are stored here
- **Fix Required:** Use environment variables or Azure Key Vault

### 5. **Missing Authorization Attributes**
- **Location:** All controllers
- **Issue:** No `[Authorize]` attributes on any controller endpoints
- **Impact:** Unauthenticated users can access all API endpoints
- **Affected Files:**
  - `BookingController.cs`
  - `PaymentController.cs`
  - `TripController.cs`
  - `BusController.cs`
  - All other controllers
- **Fix Required:** Add `[Authorize]` and role-based authorization

### 6. **Supabase Client Missing Environment Variables**
- **Location:** `Frontend/src/supabase/client.js` (Lines 3-6)
- **Issue:** Creates Supabase client with potentially undefined URL/key
- **Code:**
```javascript
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
```
- **Impact:** Silent failures if env vars not set; app won't work
- **Fix Required:** Add validation and error handling

### 7. **Payment Services Not Integrated**
- **Location:** `Backend/Payments/PayGateService.cs`
- **Issue:** Payment processing is **simulated** with `Task.Delay(1000)`
- **Impact:** No real payment processing occurs
- **Code (Line 19):**
```csharp
await Task.Delay(1000); // Simulate API call
```
- **Fix Required:** Implement actual PayGate API integration

---

## 🟡 MEDIUM CRITICAL ISSUES

### 8. **Incomplete CRUD Operations**
- **Location:** Multiple controllers
- **Issue:** Controllers have comments like `// ...other CRUD endpoints...` but missing implementations
- **Affected Controllers:**
  - `BookingController.cs` (Line 36) - Missing PUT, DELETE
  - `PaymentController.cs` (Line 32) - Missing PUT, DELETE
  - `TripController.cs` (Line 35) - Missing PUT, DELETE
  - `AuditLogController.cs` (Line 24) - Missing POST, PUT, DELETE
- **Impact:** Limited functionality, cannot update/delete records via API

### 9. **API Keys Controller is a Stub**
- **Location:** `Backend/Controllers/ApiKeysController.cs`
- **Issue:** All endpoints return stub messages, no actual implementation
- **Code Examples:**
```csharp
[HttpGet]
public IActionResult List() => Ok(new { message = "Use Supabase for storage or add EF model for api_keys" });

[HttpPost]
public IActionResult Create([FromBody] dynamic payload) => Ok(new { message = "Stub: Implement EF model for api_keys or keep Supabase" });
```
- **Impact:** API key management not functional

### 10. **Missing Input Validation**
- **Location:** Multiple controllers
- **Issue:** Controllers accept data without proper validation
- **Examples:**
  - `BookingController.CreateBooking` - Only checks `if (booking == null)`
  - `PaymentController.CreatePayment` - Minimal validation
  - No validation for business rules (e.g., seat capacity, duplicate bookings)
- **Impact:** Data integrity issues, potential crashes

### 11. **No Error Logging in Controllers**
- **Location:** All controllers
- **Issue:** Exceptions are caught but not logged
- **Example from `UserController.cs` (Lines 45-48):**
```csharp
catch (Exception ex)
{
    return StatusCode(500, new { error = ex.Message });
}
```
- **Impact:** Difficult to debug production issues
- **Fix Required:** Inject and use `ILogger<T>` or `AppInsightsLogger`

### 12. **AuditLog Missing CompanyId Property**
- **Location:** `Backend/Models/AuditLog.cs`
- **Issue:** Model has no `CompanyId` property but `AuditLogController` filters by it (Line 20)
- **Code Mismatch:**
  - Controller: `query.Where(a => a.CompanyId == cid.Value)`
  - Model: No `CompanyId` property exists
- **Impact:** Runtime errors when filtering audit logs
- **Fix Required:** Add `CompanyId` to AuditLog model

### 13. **Missing Timestamp Property in AuditLog**
- **Location:** `Backend/Models/AuditLog.cs` vs `Backend/Controllers/AuditLogController.cs`
- **Issue:** Controller orders by `Timestamp` (Line 21) but model has `CreatedAt`
- **Impact:** Runtime error when fetching audit logs
- **Fix Required:** Align property names

### 14. **DeveloperDashboard Uses Inefficient Queries**
- **Location:** `Backend/Controllers/DeveloperDashboardController.cs` (Lines 31-33)
- **Issue:** N+1 query problem with multiple `Count()` calls in LINQ
- **Code:**
```csharp
.OrderByDescending(c => c.Routes.Count + c.Buses.Count + _context.UserProfiles.Count(u => u.CompanyId == c.CompanyId))
```
- **Impact:** Severe performance degradation with large datasets
- **Fix Required:** Use proper aggregation or separate queries

### 15. **SignalR Hub Broadcasts to All Clients**
- **Location:** `Backend/SignalR/BusTrackingHub.cs`
- **Issue:** `UpdateBusLocation` and `SendAlert` broadcast to ALL clients, not company-specific
- **Code (Line 19):**
```csharp
await Clients.All.SendAsync("BusLocationUpdated", busLocation);
```
- **Impact:** Data leakage between companies
- **Fix Required:** Use `Clients.Group($"company_{companyId}")` instead

### 16. **UserService Role Assignment Without Role Creation**
- **Location:** `Backend/Services/UserService.cs` (Line 27)
- **Issue:** Adds user to role without checking if role exists
- **Code:**
```csharp
await _userManager.AddToRoleAsync(user, role);
```
- **Impact:** Will fail if roles haven't been seeded
- **Fix Required:** Create roles in seeder or check existence first

### 17. **Payment Model Has No Booking/Trip Reference**
- **Location:** `Backend/Models/Payment.cs`
- **Issue:** Payment has no foreign key to Booking or Trip
- **Impact:** Cannot track which payment belongs to which booking
- **Fix Required:** Add `BookingId` foreign key

### 18. **Missing File Upload Handling**
- **Location:** `Backend/Controllers/DocumentController.cs`
- **Issue:** Controller accepts `Document` object but no actual file upload handling
- **Impact:** `FilePath`, `FileName`, `FileSize`, `MimeType` must be set by client (security risk)
- **Fix Required:** Implement proper file upload with `IFormFile`

### 19. **No Rate Limiting**
- **Location:** `Backend/Program.cs`
- **Issue:** No rate limiting middleware configured
- **Impact:** Vulnerable to DoS attacks
- **Fix Required:** Add rate limiting middleware

### 20. **Frontend useAuth Hook Has Complex Fallback Logic**
- **Location:** `Frontend/src/hooks/useAuth.js` (Lines 57-94)
- **Issue:** JIT (Just-In-Time) provisioning logic is overly complex and error-prone
- **Impact:** Difficult to debug authentication issues
- **Fix Required:** Simplify auth flow or document thoroughly

---

## 🟢 MINOR ISSUES

### 21. **Inconsistent DateTime Handling**
- **Location:** Multiple models
- **Issue:** Some use `CreatedAt`, others use `Timestamp`, some have both `CreatedAt` and `UpdatedAt`
- **Impact:** Confusion, inconsistent API responses
- **Fix Required:** Standardize on `CreatedAt` and `UpdatedAt`

### 22. **Missing UpdatedAt Auto-Update**
- **Location:** All controllers with PUT endpoints
- **Issue:** `UpdatedAt` is never set when updating records
- **Example:** `BusController.UpdateBus` (Lines 44-51)
- **Fix Required:** Set `UpdatedAt = DateTime.UtcNow` on updates

### 23. **No Pagination on List Endpoints**
- **Location:** Multiple controllers
- **Issue:** All GET endpoints use `.Take(200)` hardcoded limit
- **Examples:**
  - `BookingController` (Line 24)
  - `PaymentController` (Line 20)
  - `TripController` (Line 24)
- **Impact:** Poor performance with large datasets, no way to get all records
- **Fix Required:** Implement proper pagination with skip/take parameters

### 24. **Inconsistent Query Parameter Handling**
- **Location:** Multiple controllers
- **Issue:** Some use `[FromQuery]`, some read from headers, inconsistent patterns
- **Example:** `BookingController` tries header fallback (Lines 17-18)
- **Fix Required:** Standardize on one approach

### 25. **No Soft Delete Implementation**
- **Location:** All DELETE endpoints
- **Issue:** Records are hard-deleted from database
- **Impact:** No audit trail, cannot recover deleted data
- **Fix Required:** Add `IsDeleted` flag and implement soft delete

### 26. **Missing Index Definitions**
- **Location:** `Backend/Data/AppDbContext.cs`
- **Issue:** No database indexes defined for frequently queried fields
- **Examples:** `CompanyId`, `Status`, `Email`, `CreatedAt`
- **Impact:** Slow queries as data grows
- **Fix Required:** Add index configurations in `OnModelCreating`

### 27. **ElkLogger Creates New HttpClient**
- **Location:** `Backend/Logging/ElkLogger.cs` (Line 15)
- **Issue:** Creates `new HttpClient()` instead of using `IHttpClientFactory`
- **Impact:** Socket exhaustion in high-traffic scenarios
- **Fix Required:** Use `IHttpClientFactory`

### 28. **ElkLogger Not Registered in DI**
- **Location:** `Backend/Program.cs`
- **Issue:** `ElkLogger` class exists but is never registered in dependency injection
- **Impact:** Cannot be used in controllers
- **Fix Required:** Add `builder.Services.AddScoped<ElkLogger>()`

### 29. **AppInsightsLogger Not Registered**
- **Location:** `Backend/Program.cs`
- **Issue:** `AppInsightsLogger` exists but not registered in DI
- **Impact:** Cannot be used
- **Fix Required:** Register in DI container

### 30. **Frontend Has Duplicate App Files**
- **Location:** `Frontend/src/`
- **Issue:** Both `App.jsx` and `App-ios-compatible.jsx` exist
- **Impact:** Confusion about which is used
- **Fix Required:** Remove unused file or document purpose

### 31. **Test Mode Bypasses Security**
- **Location:** `Frontend/src/pages/Login.jsx` (Line 22)
- **Issue:** `USE_TEST_LOGIN` completely bypasses Supabase auth
- **Impact:** If accidentally enabled in production, major security breach
- **Fix Required:** Ensure this is NEVER enabled in production builds

### 32. **Global Window Variables**
- **Location:** `Frontend/src/App.jsx` (Lines 35-42)
- **Issue:** Uses `window.companyId`, `window.userRole`, `window.user` for state
- **Impact:** Not React best practice, can cause sync issues
- **Fix Required:** Use React Context or state management library

### 33. **No Loading States in App.jsx**
- **Location:** `Frontend/src/App.jsx` (Line 87)
- **Issue:** Suspense fallback is `null`
- **Impact:** Blank screen during lazy loading
- **Fix Required:** Add proper loading indicator

### 34. **Missing Environment Variable Validation**
- **Location:** Frontend and Backend
- **Issue:** No startup validation that required env vars are set
- **Impact:** Silent failures, hard to diagnose
- **Fix Required:** Add validation on app startup

### 35. **No API Response Type Definitions**
- **Location:** Frontend
- **Issue:** No TypeScript or PropTypes for API responses
- **Impact:** Runtime errors, difficult to maintain
- **Fix Required:** Add TypeScript or PropTypes

### 36. **Incident Model Has Nullable CompanyId**
- **Location:** `Backend/Models/Incident.cs` (Line 38)
- **Issue:** `CompanyId` is nullable but incidents should belong to a company
- **Impact:** Orphaned incidents
- **Fix Required:** Make `CompanyId` required

### 37. **Document Model Has Nullable CompanyId**
- **Location:** `Backend/Models/Document.cs` (Line 35)
- **Issue:** Same as above
- **Fix Required:** Make `CompanyId` required

### 38. **Message Model Has Nullable CompanyId**
- **Location:** `Backend/Models/Message.cs` (Line 22)
- **Issue:** Same as above
- **Fix Required:** Make `CompanyId` required

### 39. **No Email Validation on User Creation**
- **Location:** `Backend/Services/UserService.cs`
- **Issue:** Email format not validated before creating user
- **Impact:** Invalid emails in database
- **Fix Required:** Add email validation

### 40. **No Duplicate Email Check**
- **Location:** `Backend/Services/UserService.cs`
- **Issue:** No check if email already exists before creating user
- **Impact:** Duplicate user errors
- **Fix Required:** Check for existing email first

### 41. **StripeService Currency Hardcoded**
- **Location:** `Backend/Payments/StripeService.cs` (Line 19)
- **Issue:** Default currency is "usd" but system is for South African market
- **Impact:** Wrong currency for payments
- **Fix Required:** Use "zar" or make configurable

### 42. **Payment Intent Amount Conversion**
- **Location:** `Backend/Payments/StripeService.cs` (Line 23)
- **Issue:** Converts to cents but comment says "Convert to cents" - Stripe uses smallest currency unit
- **Impact:** May be incorrect for non-cent currencies
- **Fix Required:** Document or use proper currency handling

### 43. **No Transaction Rollback on Errors**
- **Location:** All controllers
- **Issue:** No database transaction management
- **Impact:** Partial updates on errors
- **Fix Required:** Use transactions for multi-step operations

### 44. **No Concurrency Control**
- **Location:** All models
- **Issue:** No `RowVersion` or timestamp for optimistic concurrency
- **Impact:** Lost updates in concurrent scenarios
- **Fix Required:** Add concurrency tokens

### 45. **Bus Capacity Not Validated**
- **Location:** `Backend/Controllers/BusController.cs`
- **Issue:** No validation that capacity is positive
- **Impact:** Can create buses with 0 or negative capacity
- **Fix Required:** Add validation

### 46. **Route Distance Not Validated**
- **Location:** `Backend/Controllers/RouteController.cs`
- **Issue:** No validation that distance is positive
- **Impact:** Can create routes with invalid distances
- **Fix Required:** Add validation

### 47. **No Booking Seat Validation**
- **Location:** `Backend/Controllers/BookingController.cs`
- **Issue:** No check if seat number exceeds bus capacity or is already booked
- **Impact:** Overbooking, duplicate seat assignments
- **Fix Required:** Add seat validation logic

### 48. **Trip Status Not Validated**
- **Location:** `Backend/Controllers/TripController.cs`
- **Issue:** No validation of status transitions (e.g., can't go from "Completed" to "Scheduled")
- **Impact:** Invalid state transitions
- **Fix Required:** Add state machine validation

### 49. **No API Versioning**
- **Location:** All controllers
- **Issue:** No API versioning strategy
- **Impact:** Breaking changes will affect all clients
- **Fix Required:** Implement API versioning

### 50. **Missing Health Check Endpoint**
- **Location:** `Backend/Program.cs`
- **Issue:** No `/health` endpoint for monitoring
- **Impact:** Cannot monitor service health
- **Fix Required:** Add health check middleware

---

## 📊 SUMMARY STATISTICS

| Severity | Count | Percentage |
|----------|-------|------------|
| 🔴 Critical | 7 | 14% |
| 🟡 Medium | 13 | 26% |
| 🟢 Minor | 30 | 60% |
| **Total** | **50** | **100%** |

---

## 🎯 PRIORITY RECOMMENDATIONS

### Immediate Action Required (Next Sprint):
1. Fix JWT authentication configuration
2. Add authorization attributes to all controllers
3. Restrict CORS policy
4. Add CompanyId to AuditLog model
5. Fix AuditLog Timestamp property mismatch
6. Implement proper file upload handling
7. Fix SignalR company isolation

### Short Term (Next 2-4 Weeks):
1. Complete missing CRUD endpoints
2. Implement proper payment integration
3. Add input validation across all endpoints
4. Implement error logging
5. Add pagination to list endpoints
6. Implement soft delete
7. Add database indexes

### Medium Term (1-3 Months):
1. Implement rate limiting
2. Add API versioning
3. Implement proper transaction management
4. Add concurrency control
5. Migrate from window globals to React Context
6. Add TypeScript or PropTypes
7. Implement health checks

---

## 📝 NOTES

- Many issues stem from rapid development without security/production considerations
- The system has good architecture but needs hardening for production
- Frontend and Backend have different authentication strategies (Supabase vs ASP.NET Identity) which may cause confusion
- Database seeding being disabled suggests environment configuration issues

---

**End of Report**
