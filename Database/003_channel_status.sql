-- Channel Status table for communications health
-- Safe to run; creates table if missing

create table if not exists public.channel_status (
  company_id uuid not null references public.companies(company_id) on delete cascade,
  service text not null check (service in ('email','sms','push','in_app')),
  status text not null check (status in ('active','down','degraded')),
  message text,
  updated_at timestamptz default now(),
  primary key (company_id, service)
);

-- Optional RLS (adjust)
alter table public.channel_status enable row level security;
-- Example policies commented out
-- create policy channel_status_select on public.channel_status for select using (
--   company_id = (auth.jwt() ->> 'company_id')::uuid
-- );
-- create policy channel_status_upd on public.channel_status for update using (
--   company_id = (auth.jwt() ->> 'company_id')::uuid
-- );
