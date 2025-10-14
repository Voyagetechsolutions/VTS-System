-- Create missing admin_* RPC functions that are causing 404 errors
-- Run this after creating the basic tables and views

-- 1. admin_bookings_today function
CREATE OR REPLACE FUNCTION public.admin_bookings_today(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.bookings_with_company b
  WHERE b.company_id = $1
    AND b.booking_date::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. admin_large_refunds_pending function
CREATE OR REPLACE FUNCTION public.admin_large_refunds_pending(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.refunds r
  WHERE r.company_id = $1
    AND r.status = 'pending_approval'
    AND r.amount >= 1000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. admin_reconciliation_status function
CREATE OR REPLACE FUNCTION public.admin_reconciliation_status(company_id UUID)
RETURNS TEXT AS $$
DECLARE
  status TEXT := 'OK';
BEGIN
  -- Check if there are any bookings today that haven't been reconciled
  IF EXISTS (
    SELECT 1 FROM public.bookings_with_company b
    WHERE b.company_id = $1
      AND b.booking_date::date = CURRENT_DATE
      AND b.payment_status NOT IN ('completed', 'refunded')
  ) THEN
    status := 'PENDING';
  END IF;

  RETURN status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. admin_blacklist_overrides_today function
CREATE OR REPLACE FUNCTION public.admin_blacklist_overrides_today(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. admin_boarding_incidents_today function
CREATE OR REPLACE FUNCTION public.admin_boarding_incidents_today(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.incidents i
  WHERE i.company_id = $1
    AND i.type = 'boarding'
    AND i.created_at::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. admin_seat_utilization_pct function
CREATE OR REPLACE FUNCTION public.admin_seat_utilization_pct(company_id UUID)
RETURNS TABLE(pct NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(AVG(
    CASE WHEN t.seats_sold IS NOT NULL AND t.capacity > 0
      THEN (t.seats_sold::numeric / t.capacity::numeric) * 100
      ELSE 0 END
  ), 0)::NUMERIC(5,2) as pct
  FROM public.trips t
  WHERE t.company_id = $1
    AND t.departure_time::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. admin_boarding_delays function
CREATE OR REPLACE FUNCTION public.admin_boarding_delays(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.trips t
  WHERE t.company_id = $1
    AND t.departure_time::date = CURRENT_DATE
    AND t.actual_departure_time > t.departure_time + INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. admin_driver_trip_completion function
CREATE OR REPLACE FUNCTION public.admin_driver_trip_completion(company_id UUID)
RETURNS TABLE(pct NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(AVG(
    CASE WHEN t.status = 'completed' THEN 100.0 ELSE 0 END
  ), 0)::NUMERIC(5,2) as pct
  FROM public.trips t
  WHERE t.company_id = $1
    AND t.departure_time::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. admin_driver_accidents_today function
CREATE OR REPLACE FUNCTION public.admin_driver_accidents_today(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.incidents i
  WHERE i.company_id = $1
    AND i.type = 'accident'
    AND i.created_at::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. admin_driver_on_time_score function
CREATE OR REPLACE FUNCTION public.admin_driver_on_time_score(company_id UUID)
RETURNS TABLE(score NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(AVG(
    CASE WHEN t.actual_departure_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (t.actual_departure_time - t.departure_time)) / 60
      ELSE 0 END
  ), 0)::NUMERIC(5,2) as score
  FROM public.trips t
  WHERE t.company_id = $1
    AND t.departure_time::date = CURRENT_DATE
    AND t.actual_departure_time IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. admin_driver_expired_certs function
CREATE OR REPLACE FUNCTION public.admin_driver_expired_certs(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. admin_route_approvals_pending function
CREATE OR REPLACE FUNCTION public.admin_route_approvals_pending(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.route_requests rr
  WHERE rr.company_id = $1
    AND rr.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. admin_dead_mileage_km function
CREATE OR REPLACE FUNCTION public.admin_dead_mileage_km(company_id UUID)
RETURNS TABLE(km NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(COALESCE(t.distance_km, 0)), 0)::NUMERIC(10,2) as km
  FROM public.trips t
  WHERE t.company_id = $1
    AND t.departure_time::date = CURRENT_DATE
    AND t.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. admin_utilization_pct function
CREATE OR REPLACE FUNCTION public.admin_utilization_pct(company_id UUID)
RETURNS TABLE(pct NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(AVG(
    CASE WHEN t.status IN ('completed', 'in_progress') THEN 100.0 ELSE 0 END
  ), 0)::NUMERIC(5,2) as pct
  FROM public.trips t
  WHERE t.company_id = $1
    AND t.departure_time::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. admin_depot_staff_shortages function
CREATE OR REPLACE FUNCTION public.admin_depot_staff_shortages(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. admin_buses_down function
CREATE OR REPLACE FUNCTION public.admin_buses_down(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.buses b
  WHERE b.company_id = $1
    AND b.status IN ('maintenance', 'down', 'unavailable');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. admin_depot_readiness_pct function
CREATE OR REPLACE FUNCTION public.admin_depot_readiness_pct(company_id UUID)
RETURNS TABLE(pct NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT (100.0 * COUNT(*) FILTER (WHERE b.status IN ('active','in_service','available'))
    / GREATEST(COUNT(*),1))::NUMERIC(5,2) as pct
  FROM public.buses b
  WHERE b.company_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. admin_maintenance_major_approvals function
CREATE OR REPLACE FUNCTION public.admin_maintenance_major_approvals(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.maintenance_requests m
  WHERE m.company_id = $1
    AND m.status = 'pending_approval'
    AND m.priority = 'major';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. admin_maintenance_downtime_pct function
CREATE OR REPLACE FUNCTION public.admin_maintenance_downtime_pct(company_id UUID)
RETURNS TABLE(pct NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT (100.0 * COUNT(*) FILTER (WHERE b.status = 'maintenance')
    / GREATEST(COUNT(*),1))::NUMERIC(5,2) as pct
  FROM public.buses b
  WHERE b.company_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. admin_maintenance_month_cost function
CREATE OR REPLACE FUNCTION public.admin_maintenance_month_cost(company_id UUID)
RETURNS TABLE(cost NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::NUMERIC(12,2) as cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. admin_finance_pnl_month function
CREATE OR REPLACE FUNCTION public.admin_finance_pnl_month(company_id UUID)
RETURNS TABLE(pnl NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT (
    COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.company_id = $1
        AND p.status = 'succeeded'
        AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    ), 0)
    - COALESCE((
      SELECT SUM(e.amount)
      FROM public.expenses e
      WHERE e.company_id = $1
        AND DATE_TRUNC('month', e.date) = DATE_TRUNC('month', CURRENT_DATE)
    ), 0)
  )::NUMERIC(14,2) as pnl;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. admin_finance_high_risk_refunds function
CREATE OR REPLACE FUNCTION public.admin_finance_high_risk_refunds(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.refunds r
  WHERE r.company_id = $1
    AND r.created_at::date = CURRENT_DATE
    AND r.amount > 1000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 23. admin_finance_large_expenses_pending function
CREATE OR REPLACE FUNCTION public.admin_finance_large_expenses_pending(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 24. admin_hr_critical_hires function
CREATE OR REPLACE FUNCTION public.admin_hr_critical_hires(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25. admin_hr_payroll_adjustments_pending function
CREATE OR REPLACE FUNCTION public.admin_hr_payroll_adjustments_pending(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 26. admin_hr_turnover_rate function
CREATE OR REPLACE FUNCTION public.admin_hr_turnover_rate(company_id UUID)
RETURNS TABLE(rate NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::NUMERIC(5,2) as rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 27. admin_alerts_escalations_today function
CREATE OR REPLACE FUNCTION public.admin_alerts_escalations_today(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 28. admin_alerts_broadcasts_today function
CREATE OR REPLACE FUNCTION public.admin_alerts_broadcasts_today(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 29. admin_alert_rules_count function
CREATE OR REPLACE FUNCTION public.admin_alert_rules_count(company_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 0::BIGINT as count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
