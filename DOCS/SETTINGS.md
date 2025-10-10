# Company Admin Settings (RBAC and Module Visibility)

Settings are stored in the `company_settings` table (JSON fields) and are editable from the Admin System Settings tab.

## Keys

- `rbac`: A map of role -> permission flags
- `modules_visibility`: A map of role -> array of visible module labels

## Example JSON

```json
{
  "currency": "USD",
  "timezone": "Africa/Johannesburg",
  "rbac": {
    "admin": { "view": true, "edit": true, "approve": true, "finance": true, "hr": true },
    "ops_manager": { "view": true, "edit": true, "approve": true, "finance": false, "hr": false },
    "booking_officer": { "view": true, "edit": true, "approve": false, "finance": false, "hr": false },
    "driver": { "view": true, "edit": false, "approve": false, "finance": false, "hr": false }
  },
  "modules_visibility": {
    "admin": [
      "Executive Overview","Approvals & Oversight","Global Communications","Oversight Map","Live Map Buses",
      "User Management","Driver Hub","Customer Hub","HR: Profiles","HR: Attendance","HR: Payroll","HR: Training",
      "Fleet Management","Routes & Scheduling","Branches","Bookings & Ticketing","Reports & Analytics","Audit Trail",
      "Maintenance","Fuel Tracking","Trip Scheduling","Depot: Ops Supervisor","Depot: Dispatch","Depot: Staff & Shifts",
      "Inventory & Warehouse","Finance Center","Notifications & Alerts","Trip Info","Compliance & Safety","Documents",
      "Communications","System Settings","Profile"
    ],
    "ops_manager": [
      "Executive Overview","Approvals & Oversight","Oversight Map","User Management","Driver Hub","Fleet Management",
      "Routes & Scheduling","Bookings & Ticketing","Reports & Analytics","Audit Trail","Maintenance","Fuel Tracking",
      "Trip Scheduling","Inventory & Warehouse","Notifications & Alerts"
    ],
    "driver": ["Driver Hub","Trip Info","Communications","Profile"]
  }
}
```

## Where they are used

- `Frontend/src/components/companyAdmin/tabs/SettingsTab.jsx`
  - Edits `rbac` and `modules_visibility` and saves to `company_settings`.
- `Frontend/src/pages/CompanyAdminDashboard/index.jsx`
  - Applies `modules_visibility[role]` to filter visible tabs in the sidebar.
- `Frontend/src/components/companyAdmin/tabs/ApprovalsTab.jsx`
  - Uses `rbac[role].approve` to show/hide Review/Approve/Reject.
- `Frontend/src/components/companyAdmin/tabs/BookingsTab.jsx`
  - Uses `rbac[role].edit` to show/hide Add/Edit/Delete and dialog Save.
- `Frontend/src/components/companyAdmin/tabs/FleetTab.jsx`
  - Uses `rbac[role].edit` to show/hide Add/Actions/Edit/Delete and dialog Save.
- `Frontend/src/components/maintenanceManager/tabs/InventoryTab.jsx`
  - Uses `rbac[role].edit` to show/hide add usage/stock/procurement and row actions.
- `Frontend/src/components/companyAdmin/tabs/MaintenanceTab.jsx`
  - Uses `rbac[role].edit` to show/hide file upload and Save.

## Notes

- Roles are typically one of: `admin`, `ops_manager`, `booking_officer`, `boarding_operator`, `driver`, `depot_manager`, `maintenance_manager`, `finance_manager`, `hr_manager`.
- The `modules_visibility` labels must match the labels in `Frontend/src/pages/CompanyAdminDashboard/index.jsx`.
- You can extend RBAC with additional flags (e.g., `delete`, `export`) and wire them in relevant tabs.
