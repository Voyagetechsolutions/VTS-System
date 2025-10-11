-- Ops KPI Views for Oversight Map
-- Safe to re-run

create or replace view public.ops_depot_kpis as
select
  c.company_id,
  current_date as day,
  (100.0 * count(*) filter (where b.status in ('active','in_service','available'))
    / greatest(count(*),1))::numeric(5,2) as readiness_pct,
  count(*) filter (where s.date = current_date and s.assigned_staff_count < s.required_staff) as staff_shortages,
  count(*) filter (where b.status in ('maintenance','down','unavailable')) as buses_down
from public.companies c
left join public.buses b on b.company_id = c.company_id
left join public.depot_shifts s on s.company_id = c.company_id
group by c.company_id, current_date;

create or replace view public.ops_maintenance_kpis as
select
  c.company_id,
  current_date as day,
  (100.0 * count(*) filter (where b.status = 'maintenance')
    / greatest(count(*),1))::numeric(5,2) as downtime_pct,
  count(*) filter (where m.status = 'pending_approval' and m.priority = 'major') as major_approvals,
  coalesce(sum(case when date_trunc('month', ml.date) = date_trunc('month', current_date)
                    then ml.cost else 0 end), 0)::numeric(12,2) as month_cost
from public.companies c
left join public.buses b on b.company_id = c.company_id
left join public.maintenance_requests m on m.company_id = c.company_id
left join public.maintenance_logs ml on ml.company_id = c.company_id
group by c.company_id, current_date;

create or replace view public.ops_finance_kpis as
select
  c.company_id,
  current_date as day,
  (
    coalesce((
      select sum(p.amount)
      from public.payments p
      where p.company_id = c.company_id
        and p.status = 'succeeded'
        and date_trunc('month', p.created_at) = date_trunc('month', current_date)
    ), 0)
    - coalesce((
      select sum(e.amount)
      from public.expenses e
      where e.company_id = c.company_id
        and date_trunc('month', e.date) = date_trunc('month', current_date)
    ), 0)
  )::numeric(14,2) as pnl_month,
  coalesce((
    select count(*)
    from public.refunds r
    where r.company_id = c.company_id
      and r.created_at::date = current_date
      and (r.reason ilike '%fraud%' or r.amount > 1000)
  ), 0) as high_risk_refunds,
  coalesce((
    select count(*)
    from public.expenses e
    where e.company_id = c.company_id
      and e.status = 'pending_approval'
      and e.amount >= 1000
  ), 0) as large_expenses_pending
from public.companies c;

create or replace view public.ops_hr_kpis as
select
  c.company_id,
  current_date as day,
  (
    100.0 * coalesce((
      select count(*)
      from public.users u
      where u.company_id = c.company_id
        and u.is_active = false
        and u.updated_at >= now() - interval '30 days'
    ), 0)
    / greatest(coalesce((
      select avg(cnt)
      from (
        select count(*) as cnt
        from public.users u2
        where u2.company_id = c.company_id
        group by date_trunc('week', coalesce(u2.created_at, now()))
      ) t
    ), 1), 1)
  )::numeric(5,2) as turnover_rate,
  coalesce((
    select count(*)
    from public.hr_open_roles r
    where r.company_id = c.company_id
      and r.role in ('driver','depot_manager')
      and r.status = 'open'
  ), 0) as critical_hires,
  coalesce((
    select count(*)
    from public.payroll_adjustments pa
    where pa.company_id = c.company_id
      and pa.status = 'pending'
  ), 0) as payroll_adjustments
from public.companies c;

create or replace view public.ops_alerts_kpis as
select
  c.company_id,
  current_date as day,
  coalesce((
    select count(*)
    from public.alerts a
    where a.company_id = c.company_id
      and a.level in ('high','critical')
      and a.created_at::date = current_date
  ), 0) as escalations_today,
  coalesce((
    select count(*)
    from public.announcements an
    where an.company_id = c.company_id
      and an.created_at::date = current_date
  ), 0) as broadcasts,
  coalesce((
    select count(*)
    from public.notification_policies np
    where np.company_id = c.company_id
  ), 0) as rules
from public.companies c;
