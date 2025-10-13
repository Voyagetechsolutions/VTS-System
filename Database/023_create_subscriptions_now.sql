-- IMMEDIATE FIX: Create subscriptions for all companies
-- Run this script NOW to populate the subscriptions table

-- Insert subscriptions for all companies that don't have one
INSERT INTO subscriptions (company_id, plan, status, start_date, end_date, amount, billing_cycle, next_billing_date)
SELECT 
  c.company_id,
  CASE 
    WHEN random() < 0.33 THEN 'basic'
    WHEN random() < 0.66 THEN 'standard'
    ELSE 'premium'
  END AS plan,
  CASE 
    WHEN c.is_active THEN 'active'
    ELSE 'suspended'
  END AS status,
  NOW() - INTERVAL '30 days' AS start_date,
  NOW() + INTERVAL '335 days' AS end_date,
  CASE 
    WHEN random() < 0.33 THEN 999.00
    WHEN random() < 0.66 THEN 1999.00
    ELSE 3999.00
  END AS amount,
  'monthly' AS billing_cycle,
  NOW() + INTERVAL '5 days' AS next_billing_date
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.company_id = c.company_id
);

-- Verify subscriptions were created
SELECT 
  COUNT(*) as total_subscriptions_created
FROM subscriptions;

-- Show sample data
SELECT 
  s.id,
  c.name as company_name,
  s.plan,
  s.status,
  s.amount,
  s.next_billing_date
FROM subscriptions s
JOIN companies c ON s.company_id = c.company_id
ORDER BY s.created_at DESC
LIMIT 10;
