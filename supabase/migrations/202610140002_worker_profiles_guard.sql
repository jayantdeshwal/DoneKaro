-- Migration: 202610140002_worker_profiles_guard.sql
-- Lock down public.worker_profiles with defense-in-depth:
-- 1. Table/column-level REVOKE so unprivileged clients cannot directly insert or touch sensitive columns.
-- 2. State-transition trigger guard enforcing caller context via PL/pgSQL call stack (PG_CONTEXT)
--    and current_user, without trusting client-settable custom GUCs.
-- 3. Document ownership and re-review enforcement for approved workers.
--
-- Rollback reference: scripts/rollback_worker_profiles_guard.sql
-- Staging harness: scripts/test-db-staging.mjs
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.worker_profiles') IS NULL THEN
    RAISE EXCEPTION 'public.worker_profiles does not exist';
  END IF;
  IF to_regprocedure('public.register_worker(text,text,text,integer,text,text[],text,text,text[])') IS NULL THEN
    RAISE EXCEPTION 'public.register_worker 9-arg overload must exist before 002 can be applied';
  END IF;
  IF to_regprocedure('public.recalculate_worker_rating()') IS NULL THEN
    RAISE EXCEPTION 'public.recalculate_worker_rating() must exist before 002 can be applied';
  END IF;
  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'public.is_admin() must exist before 002 can be applied';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'register_worker'
      AND pronamespace = 'public'::regnamespace
    GROUP BY proname
    HAVING count(*) <> 1
  ) THEN
    RAISE EXCEPTION 'Expected exactly 1 register_worker overload; resolve 001 first';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_attrdef d
    JOIN pg_class c ON c.oid = d.adrelid
    JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
    WHERE c.oid = 'public.worker_profiles'::regclass
      AND a.attname = 'approval_status'
      AND pg_get_expr(d.adbin, d.adrelid) NOT LIKE '''pending''%'
  ) THEN
    RAISE EXCEPTION 'worker_profiles.approval_status default must evaluate to pending';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_attrdef d
    JOIN pg_class c ON c.oid = d.adrelid
    JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
    WHERE c.oid = 'public.worker_profiles'::regclass
      AND a.attname = 'rating'
      AND pg_get_expr(d.adbin, d.adrelid) <> '0'
  ) OR EXISTS (
    SELECT 1
    FROM pg_attrdef d
    JOIN pg_class c ON c.oid = d.adrelid
    JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
    WHERE c.oid = 'public.worker_profiles'::regclass
      AND a.attname = 'review_count'
      AND pg_get_expr(d.adbin, d.adrelid) <> '0'
  ) THEN
    RAISE EXCEPTION 'worker_profiles rating/review_count defaults must both equal 0';
  END IF;
END;
$$;

-- Revoke direct INSERT on worker_profiles from unprivileged roles.
-- Worker profile creation must happen exclusively via the authoritative register_worker RPC.
REVOKE INSERT ON public.worker_profiles FROM anon, authenticated, public;

-- Revoke whole-table UPDATE from unprivileged roles, then grant update exclusively
-- on nonsensitive, client-editable fields.
REVOKE UPDATE ON public.worker_profiles FROM anon, authenticated, public;
GRANT UPDATE (bio, experience_years, is_available, id_proof_url, updated_at)
  ON public.worker_profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_worker_profile_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ctx text;
BEGIN
  -- 1. Permit migrations and privileged SQL Editor execution as postgres/supabase_admin
  -- when not acting on behalf of an authenticated JWT session.
  IF session_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Administrators may review/approve/reject and perform authorized management.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Extract the PL/pgSQL call stack to identify trusted callers without relying
  -- on client-settable GUCs.
  GET DIAGNOSTICS v_ctx = PG_CONTEXT;

  -- 3. Trusted writer: register_worker
  -- Allowed only when executing inside register_worker under table-owner privileges.
  IF current_user IN ('postgres', 'supabase_admin') AND v_ctx LIKE '%register_worker%' THEN
    -- Invariant: register_worker only creates pending profiles or returns rejected to pending.
    IF NEW.approval_status::text NOT IN ('pending', 'approved') THEN
      RAISE EXCEPTION 'register_worker can only set pending approval status';
    END IF;
    IF NEW.rating IS DISTINCT FROM 0::numeric OR NEW.review_count IS DISTINCT FROM 0::integer THEN
      RAISE EXCEPTION 'register_worker cannot assign non-default ratings or review counts';
    END IF;
    RETURN NEW;
  END IF;

  -- 4. Trusted writer: recalculate_worker_rating
  -- Allowed only when executing inside recalculate_worker_rating under table-owner privileges.
  IF current_user IN ('postgres', 'supabase_admin') AND v_ctx LIKE '%recalculate_worker_rating%' THEN
    IF TG_OP <> 'UPDATE'
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.bio IS DISTINCT FROM OLD.bio
       OR NEW.experience_years IS DISTINCT FROM OLD.experience_years
       OR NEW.is_available IS DISTINCT FROM OLD.is_available
       OR NEW.id_proof_url IS DISTINCT FROM OLD.id_proof_url
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Rating recalculation may change only rating, review_count, and updated_at';
    END IF;
    RETURN NEW;
  END IF;

  -- 5. Direct client writes:
  -- Must target the authenticated user's own profile.
  IF auth.uid() IS NULL OR NEW.id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Direct worker profile writes must target the authenticated user';
  END IF;

  -- Direct INSERT is forbidden for unprivileged clients (must use register_worker).
  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Direct worker profile inserts must start with pending approval';
  END IF;

  -- Direct UPDATE restrictions:
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Direct worker profile updates cannot change id';
  END IF;
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    RAISE EXCEPTION 'Direct worker profile updates cannot change approval_status';
  END IF;
  IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'Direct worker profile updates cannot change rejection_reason';
  END IF;
  IF NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Direct worker profile updates cannot change approved_at';
  END IF;
  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    RAISE EXCEPTION 'Direct worker profile updates cannot change rating';
  END IF;
  IF NEW.review_count IS DISTINCT FROM OLD.review_count THEN
    RAISE EXCEPTION 'Direct worker profile updates cannot change review_count';
  END IF;

  -- Policy: An approved worker cannot replace their ID document without re-review.
  IF OLD.approval_status::text = 'approved'
     AND NEW.id_proof_url IS DISTINCT FROM OLD.id_proof_url THEN
    RAISE EXCEPTION 'Approved workers cannot replace ID documents without re-review';
  END IF;

  -- Document path ownership validation.
  IF NEW.id_proof_url IS NOT NULL
     AND (NEW.id_proof_url NOT LIKE auth.uid()::text || '/%' OR NEW.id_proof_url LIKE '%..%') THEN
    RAISE EXCEPTION 'Worker ID document path must belong to the authenticated user and cannot contain ..';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_00_guard_worker_profile_writes ON public.worker_profiles;
CREATE TRIGGER trg_00_guard_worker_profile_writes
BEFORE INSERT OR UPDATE ON public.worker_profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_worker_profile_writes();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_00_guard_worker_profile_writes'
      AND tgrelid = 'public.worker_profiles'::regclass
  ) THEN
    RAISE EXCEPTION 'worker_profiles guard trigger was not created';
  END IF;
END;
$$;

COMMIT;
