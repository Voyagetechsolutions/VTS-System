-- Add missing columns to existing incidents table
-- Run this if the incidents table already exists but is missing columns

-- Add type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'type'
  ) THEN
    ALTER TABLE incidents ADD COLUMN type VARCHAR(50) DEFAULT 'service';
  END IF;
END $$;

-- Add severity column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'severity'
  ) THEN
    ALTER TABLE incidents ADD COLUMN severity VARCHAR(20) DEFAULT 'medium';
  END IF;
END $$;

-- Add company_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE incidents ADD COLUMN company_id UUID REFERENCES companies(company_id);
  END IF;
END $$;

-- Add reported_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'reported_by'
  ) THEN
    ALTER TABLE incidents ADD COLUMN reported_by UUID REFERENCES users(user_id);
  END IF;
END $$;

-- Add assigned_to column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE incidents ADD COLUMN assigned_to UUID REFERENCES users(user_id);
  END IF;
END $$;

-- Add resolved_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE incidents ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Verify columns were added
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
ORDER BY ordinal_position;
