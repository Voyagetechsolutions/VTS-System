-- Create missing ops_*_kpis views that are causing 404 errors
-- Run this after 001_ops_kpis_views.sql

-- 1. ops_booking_office_kpis view
CREATE OR REPLACE VIEW public.ops_booking_office_kpis AS
SELECT
  c.company_id,
  CURRENT_DATE as day,
  COALESCE((
    SELECT COUNT(*)
    FROM public.bookings_with_company b
    WHERE b.company_id = c.company_id
      AND b.booking_date::date = CURRENT_DATE
  ), 0) as bookings_today,
  COALESCE((
    SELECT COUNT(*)
    FROM public.refunds r
    WHERE r.company_id = c.company_id
      AND r.status = 'pending_approval'
      AND r.created_at::date = CURRENT_DATE
  ), 0) as refunds_pending_today,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.bookings_with_company b
      WHERE b.company_id = c.company_id
        AND b.booking_date::date = CURRENT_DATE
        AND b.payment_status NOT IN ('completed', 'refunded')
    ) THEN 'PENDING'
    ELSE 'OK'
  END as reconciliation_status,
  COALESCE((
    SELECT COUNT(*)
    FROM public.bookings_with_company b
    WHERE b.company_id = c.company_id
      AND b.booking_date::date = CURRENT_DATE
  ), 0) as potentially_fraud,
  0 as blacklist_overrides
FROM public.companies c;

-- 2. ops_boarding_kpis view
CREATE OR REPLACE VIEW public.ops_boarding_kpis AS
SELECT
  c.company_id,
  CURRENT_DATE as day,
  COALESCE((
    SELECT AVG(CASE WHEN t.seats_sold IS NOT NULL AND t.capacity > 0
      THEN (t.seats_sold::numeric / t.capacity::numeric) * 100
      ELSE 0 END)
    FROM public.trips t
    WHERE t.company_id = c.company_id
      AND t.departure_time::date = CURRENT_DATE
  ), 0)::numeric(5,2) as seat_utilization_pct,
  COALESCE((
    SELECT COUNT(*)
    FROM public.incidents i
    WHERE i.company_id = c.company_id
      AND i.type = 'boarding'
      AND i.created_at::date = CURRENT_DATE
  ), 0) as incidents,
  COALESCE((
    SELECT COUNT(*)
    FROM public.trips t
    WHERE t.company_id = c.company_id
      AND t.departure_time::date = CURRENT_DATE
      AND t.actual_departure_time > t.departure_time + INTERVAL '15 minutes'
  ), 0) as delays
FROM public.companies c;

-- 3. ops_driver_kpis view
CREATE OR REPLACE VIEW public.ops_driver_kpis AS
SELECT
  c.company_id,
  CURRENT_DATE as day,
  COALESCE((
    SELECT AVG(CASE WHEN t.status = 'completed' THEN 100.0 ELSE 0 END)
    FROM public.trips t
    WHERE t.company_id = c.company_id
      AND t.departure_time::date = CURRENT_DATE
  ), 0)::numeric(5,2) as completion_pct,
  COALESCE((
    SELECT COUNT(*)
    FROM public.incidents i
    WHERE i.company_id = c.company_id
      AND i.type = 'accident'
      AND i.created_at::date = CURRENT_DATE
  ), 0) as accidents,
  COALESCE((
    SELECT AVG(CASE WHEN t.actual_departure_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (t.actual_departure_time - t.departure_time)) / 60
      ELSE 0 END)
    FROM public.trips t
    WHERE t.company_id = c.company_id
      AND t.departure_time::date = CURRENT_DATE
      AND t.actual_departure_time IS NOT NULL
  ), 0)::numeric(5,2) as on_time_score,
  0 as expired_certs
FROM public.companies c;

-- 4. ops_operations_kpis view
CREATE OR REPLACE VIEW public.ops_operations_kpis AS
SELECT
  c.company_id,
  CURRENT_DATE as day,
  COALESCE((
    SELECT AVG(CASE WHEN t.status IN ('completed', 'in_progress')
      THEN 100.0 ELSE 0 END)
    FROM public.trips t
    WHERE t.company_id = c.company_id
      AND t.departure_time::date = CURRENT_DATE
  ), 0)::numeric(5,2) as utilization_pct,
  COALESCE((
    SELECT SUM(COALESCE(t.distance_km, 0))
    FROM public.trips t
    WHERE t.company_id = c.company_id
      AND t.departure_time::date = CURRENT_DATE
      AND t.status = 'completed'
  ), 0)::numeric(10,2) as dead_mileage_km,
  COALESCE((
    SELECT COUNT(*)
    FROM public.route_requests rr
    WHERE rr.company_id = c.company_id
      AND rr.status = 'pending'
  ), 0) as approvals_pending
FROM public.companies c;
