### EXPLAIN ANALYZE targets and indexes

Queries to inspect:
- `SELECT * FROM finance_drilldown WHERE company_id = $1 AND date BETWEEN $2 AND $3`
- `SELECT * FROM trip_occupancy WHERE company_id = $1 AND trip_date >= now() - interval '30 days'`
- `finance_revenue_by_day`, `finance_revenue_by_route`, `route_profitability`

Indexes already present:
- `idx_payments_booking_paid_at (booking_id, paid_at, status)`
- `idx_bookings_trip_date (trip_id, booking_date)`
- `idx_trips_route_departure (route_id, departure_time)`
- Company scoping indexes on many tables.

Guidance:
- Ensure `routes(company_id)` and `bookings(trip_id,status)` partial unique index prevent double seats.
- Use covering indexes for frequent filters: `(company_id, created_at)`, `(company_id, status)`.
- Run: `EXPLAIN ANALYZE SELECT ...` on production-like dataset and record plans here.


