-- Route Schedules table to support Trip Scheduling tab
-- Safe to run; creates table if missing

create table if not exists public.route_schedules (
  schedule_id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(company_id) on delete cascade,
  route_id uuid not null references public.routes(route_id) on delete cascade,
  bus_id uuid references public.buses(bus_id) on delete set null,
  driver_id uuid references public.drivers(driver_id) on delete set null,
  departure_time timestamptz not null,
  arrival_time timestamptz,
  days_of_week text,
  created_at timestamptz default now()
);

-- Optional RLS (adjust)
alter table public.route_schedules enable row level security;
-- create policy route_schedules_select on public.route_schedules for select using (
--   company_id = (auth.jwt() ->> 'company_id')::uuid
-- );
-- create policy route_schedules_insert on public.route_schedules for insert with check (
--   company_id = (auth.jwt() ->> 'company_id')::uuid
-- );
-- create policy route_schedules_update on public.route_schedules for update using (
--   company_id = (auth.jwt() ->> 'company_id')::uuid
-- );  
