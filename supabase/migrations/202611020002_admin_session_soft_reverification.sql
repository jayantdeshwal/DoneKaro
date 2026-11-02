BEGIN;

ALTER TABLE public.admin_2fa_sessions
  ADD COLUMN IF NOT EXISTS hard_expires_at timestamptz;

UPDATE public.admin_2fa_sessions
SET hard_expires_at = created_at + interval '6 hours'
WHERE hard_expires_at IS NULL;

ALTER TABLE public.admin_2fa_sessions
  ALTER COLUMN hard_expires_at SET DEFAULT (now() + interval '6 hours'),
  ALTER COLUMN hard_expires_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.require_admin_2fa()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_session_id text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required.';
  END IF;

  v_session_id := public.get_jwt_session_id();
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: JWT session_id missing. Please sign in again.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_2fa_sessions
    WHERE admin_id = v_uid
      AND session_id = v_session_id
      AND expires_at > now()
      AND hard_expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Admin 2FA authorization required or expired. Please complete 2FA verification.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_2fa_active()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_session_id text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_admin() THEN
    RETURN false;
  END IF;

  v_session_id := public.get_jwt_session_id();
  IF v_session_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_2fa_sessions
    WHERE admin_id = v_uid
      AND session_id = v_session_id
      AND expires_at > now()
      AND hard_expires_at > now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_session_status()
RETURNS TABLE (
  active boolean,
  expires_at timestamptz,
  hard_expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_session_id text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_admin() THEN
    RETURN QUERY SELECT false, NULL::timestamptz, NULL::timestamptz;
    RETURN;
  END IF;

  v_session_id := public.get_jwt_session_id();
  IF v_session_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::timestamptz, NULL::timestamptz;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.expires_at > now() AND s.hard_expires_at > now(),
    s.expires_at,
    s.hard_expires_at
  FROM public.admin_2fa_sessions s
  WHERE s.admin_id = v_uid
    AND s.session_id = v_session_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_session_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_session_status() TO authenticated, service_role;

COMMIT;
