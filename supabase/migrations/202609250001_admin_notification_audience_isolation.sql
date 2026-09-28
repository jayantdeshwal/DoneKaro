-- ============================================================================
-- Migration: 202609250001_admin_notification_audience_isolation.sql
-- Description: Enforces strict audience isolation on notifications table.
-- Prevents participant-facing booking notifications (customer/worker) from leaking
-- into administrator operational feeds (Admin Alerts).
--
-- Authoritative Admin Notification Types:
-- - 'worker_registration_submitted'
-- - 'worker_document_uploaded'
-- ============================================================================

-- 1. Restrict RLS SELECT policy on public.notifications for Administrators.
-- Previously: Admins could select ALL notifications in the entire table.
-- Now: Admins can only select notifications explicitly addressed to them OR
-- operational/admin-targeted notification types.
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view admin notifications" ON public.notifications;

CREATE POLICY "Admins can view admin notifications"
ON public.notifications FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    public.is_admin()
    AND notification_type IN (
      'worker_registration_submitted',
      'worker_document_uploaded'
    )
  )
);

-- 2. Restrict RLS UPDATE policy on public.notifications for Administrators.
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can update admin notifications" ON public.notifications;

CREATE POLICY "Admins can update admin notifications"
ON public.notifications FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    public.is_admin()
    AND notification_type IN (
      'worker_registration_submitted',
      'worker_document_uploaded'
    )
  )
);

-- 3. Dedicated Admin Notifications RPC with explicit audience boundary.
-- Enforces 2FA verification and restricts returned rows strictly to verified admin operational types.
DROP FUNCTION IF EXISTS public.get_admin_notifications(integer);

CREATE OR REPLACE FUNCTION public.get_admin_notifications(limit_count integer DEFAULT 100)
RETURNS TABLE (
  id                uuid,
  user_id           uuid,
  booking_id        uuid,
  notification_type text,
  title             text,
  body              text,
  read_at           timestamptz,
  created_at        timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.require_admin_2fa();

  RETURN QUERY
  SELECT
    n.id, n.user_id, n.booking_id,
    n.notification_type::text, n.title::text, n.body::text,
    n.read_at, n.created_at
  FROM public.notifications n
  WHERE (
    n.user_id = auth.uid()
    OR n.user_id IN (SELECT p.id FROM public.profiles p WHERE p.role IN ('super_admin', 'sub_admin'))
  )
  AND n.notification_type IN (
    'worker_registration_submitted',
    'worker_document_uploaded'
  )
  ORDER BY n.created_at DESC
  LIMIT limit_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_notifications(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_notifications(integer) TO authenticated, service_role;

-- 4. Update worker event notification trigger function for current admin roles.
-- Ensures worker registration and ID proof uploads properly target active super_admin and sub_admin profiles.
CREATE OR REPLACE FUNCTION public.notify_admins_on_worker_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_worker_name text;
  v_category_name text;
  v_admin record;
  v_notif_type text;
  v_notif_title text;
  v_notif_body text;
BEGIN
  -- Case A: New Worker Registration or Resubmission
  IF (tg_op = 'INSERT' AND new.approval_status = 'pending')
     OR (tg_op = 'UPDATE' AND old.approval_status <> 'pending' AND new.approval_status = 'pending') THEN

    SELECT full_name INTO v_worker_name FROM public.profiles WHERE id = new.id;
    v_worker_name := coalesce(nullif(trim(v_worker_name), ''), 'New Worker');

    SELECT c.name_en INTO v_category_name
    FROM public.worker_categories wc
    JOIN public.categories c ON c.id = wc.category_id
    WHERE wc.worker_id = new.id
    LIMIT 1;
    v_category_name := coalesce(v_category_name, 'Home Services');

    v_notif_type := 'worker_registration_submitted';
    v_notif_title := 'New Worker Registration Pending Review';
    v_notif_body := v_worker_name || ' submitted registration for ' || v_category_name || ' and is waiting for document verification and approval.';

    FOR v_admin IN SELECT id FROM public.profiles WHERE role IN ('super_admin', 'sub_admin') LOOP
      INSERT INTO public.notifications (
        user_id,
        notification_type,
        title,
        body
      ) VALUES (
        v_admin.id,
        v_notif_type,
        v_notif_title,
        v_notif_body
      );
    END LOOP;

  -- Case B: Worker uploaded or replaced ID Proof Document
  ELSIF tg_op = 'UPDATE'
        AND old.id_proof_url IS DISTINCT FROM new.id_proof_url
        AND new.id_proof_url IS NOT NULL THEN

    SELECT full_name INTO v_worker_name FROM public.profiles WHERE id = new.id;
    v_worker_name := coalesce(nullif(trim(v_worker_name), ''), 'Worker');

    v_notif_type := 'worker_document_uploaded';
    v_notif_title := 'Worker ID Document Uploaded';
    v_notif_body := v_worker_name || ' uploaded a government ID verification document. Please inspect and verify.';

    FOR v_admin IN SELECT id FROM public.profiles WHERE role IN ('super_admin', 'sub_admin') LOOP
      INSERT INTO public.notifications (
        user_id,
        notification_type,
        title,
        body
      ) VALUES (
        v_admin.id,
        v_notif_type,
        v_notif_title,
        v_notif_body
      );
    END LOOP;
  END IF;

  RETURN new;
END;
$$;

-- 5. Update mark_notification_read RPC with admin boundary.
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  target_notification_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to update notifications';
  END IF;

  UPDATE public.notifications
  SET read_at = timezone('utc', now())
  WHERE id = target_notification_id
    AND (
      user_id = auth.uid()
      OR (
        public.is_admin()
        AND notification_type IN (
          'worker_registration_submitted',
          'worker_document_uploaded'
        )
      )
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated, service_role;

-- 6. Update mark_all_notifications_read RPC with admin boundary.
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to update notifications';
  END IF;

  IF public.is_admin() THEN
    UPDATE public.notifications
    SET read_at = timezone('utc', now())
    WHERE (
      user_id = auth.uid()
      OR notification_type IN (
        'worker_registration_submitted',
        'worker_document_uploaded'
      )
    )
    AND read_at IS NULL;
  ELSE
    UPDATE public.notifications
    SET read_at = timezone('utc', now())
    WHERE user_id = auth.uid()
      AND read_at IS NULL;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM public;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated, service_role;
