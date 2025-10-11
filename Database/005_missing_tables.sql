-- Missing tables and views to resolve UI 404/400 errors
-- Run this in Supabase SQL Editor

-- 1. driver_shifts table
CREATE TABLE IF NOT EXISTS public.driver_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
  driver_id uuid,
  clock_in timestamptz,
  clock_out timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_shifts ENABLE ROW LEVEL SECURITY;

-- 2. channel_status table
CREATE TABLE IF NOT EXISTS public.channel_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
  channel text NOT NULL,
  is_online boolean NOT NULL DEFAULT false,
  last_seen timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.channel_status ENABLE ROW LEVEL SECURITY;

-- 3. ops_depot_kpis view (drop and recreate to avoid column conflicts)
DROP VIEW IF EXISTS public.ops_depot_kpis;
CREATE VIEW public.ops_depot_kpis AS
SELECT c.company_id,
       0::int AS depot_issues_open,
       0::int AS depot_staff_shortages,
       0::int AS buses_available,
       0::int AS maintenance_pending,
       now() AS as_of
FROM public.companies c;

-- 4. Ensure users table has correct schema
DO $$
BEGIN
  -- Add missing columns to users table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_id') THEN
    ALTER TABLE public.users ADD COLUMN company_id uuid REFERENCES public.companies(company_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    ALTER TABLE public.users ADD COLUMN name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
    ALTER TABLE public.users ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE public.users ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE public.users ADD COLUMN role text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department') THEN
    ALTER TABLE public.users ADD COLUMN department text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
    ALTER TABLE public.users ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
    ALTER TABLE public.users ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 5. Create RLS policies for all tables (idempotent)
DO $$
BEGIN
  -- driver_shifts policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_shifts' AND policyname = 'ds_select') THEN
    CREATE POLICY ds_select ON public.driver_shifts FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_shifts' AND policyname = 'ds_insert') THEN
    CREATE POLICY ds_insert ON public.driver_shifts FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_shifts' AND policyname = 'ds_update') THEN
    CREATE POLICY ds_update ON public.driver_shifts FOR UPDATE USING (true);
  END IF;

  -- channel_status policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'channel_status' AND policyname = 'cs2_select') THEN
    CREATE POLICY cs2_select ON public.channel_status FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'channel_status' AND policyname = 'cs2_insert') THEN
    CREATE POLICY cs2_insert ON public.channel_status FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'channel_status' AND policyname = 'cs2_update') THEN
    CREATE POLICY cs2_update ON public.channel_status FOR UPDATE USING (true);
  END IF;

  -- users policies (ensure they exist)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select') THEN
    CREATE POLICY users_select ON public.users FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_insert') THEN
    CREATE POLICY users_insert ON public.users FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_update') THEN
    CREATE POLICY users_update ON public.users FOR UPDATE USING (true);
  END IF;
END $$;

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_shifts_company ON public.driver_shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver ON public.driver_shifts(driver_id);
CREATE INDEX IF NOT EXISTS idx_channel_status_company ON public.channel_status(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
