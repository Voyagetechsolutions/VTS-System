# VTS System Database Migrations

This folder contains SQL migrations for enabling new Admin Dashboard modules and analytics views.

Apply these scripts in order (001, 002, 003, 004). They are idempotent where possible. Run them in your Supabase SQL editor or via your preferred migration tool. Ensure Row Level Security (RLS) and policies are adapted to your tenant model.

## Order
- 001_ops_kpis_views.sql
- 002_driver_shifts.sql
- 003_channel_status.sql
- 004_route_schedules.sql

## Notes
- Views under `ops_*_kpis` are read-only and power the Oversight Map snapshot.
- `driver_shifts` powers Attendance/Shift Scheduling and Driver Hub KPIs.
- `channel_status` enables dynamic health chips and flip alerts.
- `route_schedules` supports the new Trip Scheduling tab.

Update RLS policies to match your JWT company scoping. Sample (pseudo) snippet:

```sql
alter table public.driver_shifts enable row level security;
create policy driver_shifts_select on public.driver_shifts for select using (
  company_id = (auth.jwt() ->> 'company_id')::uuid
);
create policy driver_shifts_insert on public.driver_shifts for insert with check (
  company_id = (auth.jwt() ->> 'company_id')::uuid
);
create policy driver_shifts_update on public.driver_shifts for update using (
  company_id = (auth.jwt() ->> 'company_id')::uuid
);
```

Adjust for your environment and claims structure.
