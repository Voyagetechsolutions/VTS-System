-- Add missing columns to all existing tables for Admin Dashboard
-- Run this before adding test data

-- ===== REFUNDS TABLE =====
-- Add reason column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refunds' AND column_name = 'reason'
  ) THEN
    ALTER TABLE refunds ADD COLUMN reason TEXT;
  END IF;
END $$;

-- Add requested_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refunds' AND column_name = 'requested_by'
  ) THEN
    ALTER TABLE refunds ADD COLUMN requested_by UUID REFERENCES users(user_id);
  END IF;
END $$;

-- Add approved_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refunds' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE refunds ADD COLUMN approved_by UUID REFERENCES users(user_id);
  END IF;
END $$;

-- Add requested_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refunds' AND column_name = 'requested_at'
  ) THEN
    ALTER TABLE refunds ADD COLUMN requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add processed_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refunds' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE refunds ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refunds' AND column_name = 'notes'
  ) THEN
    ALTER TABLE refunds ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Verify refunds columns
SELECT 
  'refunds' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'refunds'
ORDER BY ordinal_position;
