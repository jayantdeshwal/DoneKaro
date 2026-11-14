-- ============================================================================
-- Migration: 202611140001_audit_rls_policies.sql
-- Description: Phase 4 RLS Security Hardening & Role Isolation Audit
-- 1. Customer Isolation on public.bookings (SELECT, INSERT, UPDATE)
-- 2. Worker Scoping on public.service_requests and public.booking_quote_requests
-- 3. Admin Lockdown on public.admin_roles, public.profiles, and guard_profile_updates trigger
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CUSTOMER ISOLATION: public.bookings
-- ============================================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Requirement A: Customers can ONLY SELECT bookings where customer_id = auth.uid()
-- Workers can ONLY SELECT bookings assigned to them (worker_id = auth.uid())
-- Admins can SELECT all bookings
DROP POLICY IF EXISTS "Customers and assigned workers can read bookings" ON public.bookings;
CREATE POLICY "Customers and assigned workers can read bookings"
ON public.bookings FOR SELECT
USING (
  customer_id = auth.uid()
  OR worker_id = auth.uid()
  OR public.is_admin()
);

-- Requirement A: Customers can ONLY INSERT bookings where customer_id = auth.uid()
DROP POLICY IF EXISTS "Customers can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can create their own bookings" ON public.bookings;
CREATE POLICY "Customers can insert their own bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  (customer_id = auth.uid() AND auth.uid() IS NOT NULL)
  OR public.is_admin()
);

-- Requirement A: Customers can ONLY UPDATE (cancel) their own bookings
DROP POLICY IF EXISTS "Customers can cancel their pending or accepted bookings" ON public.bookings;
CREATE POLICY "Customers can cancel their pending or accepted bookings"
ON public.bookings FOR UPDATE
USING (
  customer_id = auth.uid()
  AND status IN ('pending', 'accepted')
)
WITH CHECK (
  customer_id = auth.uid()
  AND status = 'cancelled'
);

-- Requirement B: Workers can ONLY UPDATE bookings assigned to them
DROP POLICY IF EXISTS "Workers can update assigned bookings" ON public.bookings;
CREATE POLICY "Workers can update assigned bookings"
ON public.bookings FOR UPDATE
USING (
  worker_id = auth.uid()
  OR public.is_admin()
)
WITH CHECK (
  worker_id = auth.uid()
  OR public.is_admin()
);


-- ============================================================================
-- 2. WORKER SCOPING: public.service_requests & public.booking_quote_requests
-- ============================================================================
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Requirement B: Workers can ONLY see jobs offered to them or open jobs within their authorized category & service area
DROP POLICY IF EXISTS "Customers and admins can read service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Customers, quote participants and admins can read service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Scoped access to service requests" ON public.service_requests;

CREATE POLICY "Scoped access to service requests"
ON public.service_requests FOR SELECT
USING (
  customer_id = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.booking_quote_requests bqr
    WHERE bqr.service_request_id = service_requests.id
      AND bqr.worker_id = auth.uid()
  )
  OR (
    status = 'open'
    AND EXISTS (
      SELECT 1
      FROM public.worker_profiles wp
      JOIN public.worker_categories wc ON wc.worker_id = wp.id AND wc.category_id = service_requests.category_id
      JOIN public.worker_service_areas wsa ON wsa.worker_id = wp.id AND wsa.service_area_id = service_requests.service_area_id
      WHERE wp.id = auth.uid()
        AND wp.approval_status = 'approved'
        AND wp.is_available = true
    )
  )
);

ALTER TABLE public.booking_quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quote participants and admins can read quote requests" ON public.booking_quote_requests;
CREATE POLICY "Quote participants and admins can read quote requests"
ON public.booking_quote_requests FOR SELECT
USING (
  customer_id = auth.uid()
  OR worker_id = auth.uid()
  OR public.is_admin()
);


-- ============================================================================
-- 3. ADMIN LOCKDOWN: public.admin_roles & public.profiles
-- ============================================================================
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Requirement C: Lock down admin_roles so only administrators or the user themselves can inspect roles
DROP POLICY IF EXISTS "Allow read admin_roles" ON public.admin_roles;
CREATE POLICY "Allow read admin_roles"
ON public.admin_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Requirement C: Only administrators can view all profiles; customers & workers only see counterparties
DROP POLICY IF EXISTS "Users and booking participants can read profiles" ON public.profiles;
CREATE POLICY "Users and booking participants can read profiles"
ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE (b.customer_id = auth.uid() AND b.worker_id = public.profiles.id)
       OR (b.worker_id = auth.uid() AND b.customer_id = public.profiles.id)
  )
  OR EXISTS (
    SELECT 1 FROM public.booking_quote_requests bqr
    WHERE (bqr.customer_id = auth.uid() AND bqr.worker_id = public.profiles.id)
       OR (bqr.worker_id = auth.uid() AND bqr.customer_id = public.profiles.id)
  )
);

-- Requirement C: Trigger guard to strictly prohibit non-admins from modifying is_verified or role
CREATE OR REPLACE FUNCTION public.guard_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 0. Permit direct database administrator / SQL Editor executions (where session_user is postgres/supabase_admin)
  IF session_user IN ('postgres', 'supabase_admin') AND auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. Prevent ID modification
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile ID cannot be modified';
  END IF;

  -- 2. Guard is_verified modification (Only platform administrators can modify verification statuses)
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can modify verification statuses.';
    END IF;
  END IF;

  -- 3. Protect Super Admin account immutability
  IF OLD.id = public.get_super_admin_uuid() OR OLD.role = 'super_admin' THEN
    IF auth.uid() IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Action prohibited: Sub Administrators cannot modify the Super Administrator profile.';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Action prohibited: The Super Administrator account cannot be demoted or have its role modified.';
    END IF;
    IF lower(NEW.email) IS DISTINCT FROM lower(OLD.email) THEN
      RAISE EXCEPTION 'Action prohibited: The Super Administrator identity cannot be transferred or altered.';
    END IF;
  END IF;

  -- 4. Guard all role modifications
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Super Admin role can NEVER be granted by non-super-admins
    IF NEW.role = 'super_admin' AND NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Action prohibited: The super_admin role can only be assigned by the Super Administrator.';
    END IF;

    -- Sub Admin role can ONLY be granted or removed by the Super Admin
    IF (NEW.role = 'sub_admin' OR OLD.role = 'sub_admin') AND NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only the Super Administrator can assign or modify Sub Administrator roles.';
    END IF;

    -- Worker role can be granted by an administrator OR via official register_worker() RPC
    IF NEW.role = 'worker' THEN
      IF NOT (public.is_admin() OR current_setting('jugnu.worker_registration_in_progress', true) = 'true') THEN
        RAISE EXCEPTION 'Unauthorized: Role cannot be modified directly.';
      END IF;
    -- All other role modifications require administrator privileges
    ELSIF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can change user roles.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_updates ON public.profiles;
CREATE TRIGGER trg_guard_profile_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_updates();

COMMIT;

