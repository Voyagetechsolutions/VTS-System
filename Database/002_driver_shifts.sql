-- Driver Shifts table for Attendance & Scheduling
-- Safe to run; creates table if missing

create table if not exists public.driver_shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(company_id) on delete cascade,
  driver_id uuid not null references public.drivers(driver_id) on delete cascade,
  department text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  repeat text default 'None',
  status text default 'Assigned',
  created_at timestamptz default now()
);

-- Optional RLS (adjust to your JWT claim paths)
alter table public.driver_shifts enable row level security;
-- Example policies (replace auth.jwt() references with your implementation)
-- create policy driver_shifts_select on public.driver_shifts for select using (
--   company_id = (auth.jwt() ->> 'company_id')::uuid
-- );
-- create policy driver_shifts_insert on public.driver_shifts for insert with check (
--   company_id = (auth.jwt() ->> 'company_id')::uuid
-- );
-- create policy driver_shifts_update on public.driver_shifts for update using (
--   company_id = (auth.jwt() ->> 'company_id')::uuid
-- );
