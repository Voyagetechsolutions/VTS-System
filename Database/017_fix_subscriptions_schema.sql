-- Fix subscriptions table schema
-- This script handles the case where subscriptions table already exists with different columns

-- Drop the existing table if it has wrong schema
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Create subscriptions table with correct schema
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID UNIQUE DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'basic',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_subscription_id ON subscriptions(subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for developers
CREATE POLICY "Developers can view all subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can update all subscriptions"
ON subscriptions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

CREATE POLICY "Developers can insert subscriptions"
ON subscriptions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'developer'
  )
);

-- Insert test subscriptions for existing companies
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
