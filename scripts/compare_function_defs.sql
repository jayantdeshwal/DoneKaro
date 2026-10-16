-- scripts/compare_function_defs.sql
-- Read-only schema and permission evidence for staging and production comparison.
-- Run separately in each environment via the Supabase SQL Editor.
-- This script performs NO WRITES and exposes NO personal data or secrets.

-- ============================================================================
-- 1. FUNCTION SIGNATURES, DEFINITIONS, OWNERS, DEFINER STATUS, AND PERMISSIONS
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_result(p.oid) AS result_type,
  pg_get_userbyid(p.proowner) AS owner_name,
  p.prosecdef AS is_security_definer,
  p.proconfig AS function_configuration,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  md5(pg_get_functiondef(p.oid)) AS definition_md5,
  pg_get_functiondef(p.oid) AS complete_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'register_worker',
    'recalculate_worker_rating',
    'guard_worker_profile_writes',
    'guard_profile_updates',
    'is_admin',
    'check_worker_categories_invariants',
    'review_worker',
    'submit_booking_review',
    'update_worker_availability'
  )
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);

-- ============================================================================
-- 2. RELEVANT worker_profiles AND reviews TRIGGERS AND DEFINITIONS
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition,
  pg_get_userbyid(c.relowner) AS table_owner
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
  AND c.relname IN ('worker_profiles', 'reviews', 'profiles')
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 3. GUARDED COLUMN TYPES, DEFAULTS, AND NULLABILITY
-- ============================================================================
SELECT
  table_schema,
  table_name,
  column_name,
  ordinal_position,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('worker_profiles', 'worker_categories', 'worker_service_areas', 'reviews', 'profiles')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 4. TABLE CONSTRAINTS
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('worker_profiles', 'worker_categories', 'worker_service_areas', 'reviews', 'profiles')
ORDER BY c.relname, con.conname;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('worker_profiles', 'worker_categories', 'worker_service_areas', 'reviews', 'profiles')
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. TABLE-LEVEL PERMISSIONS (ROLE_TABLE_GRANTS)
-- ============================================================================
SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('worker_profiles', 'worker_categories', 'worker_service_areas', 'reviews', 'profiles')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- 7. COLUMN-LEVEL PERMISSIONS (COLUMN_PRIVILEGES)
-- ============================================================================
SELECT
  table_schema,
  table_name,
  column_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('worker_profiles', 'profiles')
ORDER BY table_name, column_name, grantee, privilege_type;

-- ============================================================================
-- 8. MIGRATION HISTORY TABLE DISCOVERY
-- (Inspect actual columns first; do not assume inserted_at or version exists)
-- ============================================================================
SELECT
  table_schema,
  table_name,
  column_name,
  ordinal_position,
  data_type
FROM information_schema.columns
WHERE table_schema IN ('supabase_migrations', 'supabase')
  AND table_name IN ('schema_migrations', 'migrations')
ORDER BY table_schema, table_name, ordinal_position;
