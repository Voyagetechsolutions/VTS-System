-- Verify subscriptions table exists and has data

-- 1. Check if table exists
SELECT 
  'Table exists:' as status,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'subscriptions'
  ) as table_exists;

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 3. Count subscriptions
SELECT 
  'Total subscriptions:' as info,
  COUNT(*) as count
FROM subscriptions;

-- 4. View all subscriptions with company names
SELECT 
  s.id,
  s.subscription_id,
  c.company_id,
  c.name as company_name,
  s.plan,
  s.status,
  s.amount,
  s.next_billing_date,
  s.created_at
FROM subscriptions s
LEFT JOIN companies c ON s.company_id = c.company_id
ORDER BY s.created_at DESC;

-- 5. Check if companies exist
SELECT 
  'Total companies:' as info,
  COUNT(*) as count
FROM companies;

-- 6. If no subscriptions exist, create them
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

-- 7. Verify subscriptions were created
SELECT 
  'Subscriptions after insert:' as info,
  COUNT(*) as count
FROM subscriptions;
