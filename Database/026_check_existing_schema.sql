-- Check existing table schemas to see what columns they have

-- Check incidents table
SELECT 
  'incidents' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'incidents'
ORDER BY ordinal_position;

-- Check refunds table
SELECT 
  'refunds' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'refunds'
ORDER BY ordinal_position;

-- Check if other tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('route_requests', 'maintenance_requests', 'hr_actions', 'staff')
ORDER BY table_name;
