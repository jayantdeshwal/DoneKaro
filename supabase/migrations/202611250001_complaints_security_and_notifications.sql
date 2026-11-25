-- ============================================================================
-- Migration: 202611250001_complaints_security_and_notifications.sql
-- Description: Hardens public.complaints RLS, prevents duplicate active
-- complaints per user/booking, adds admin & complainant notification triggers,
-- enables web push queueing for complaint events, and updates admin
-- notification audience isolation for 'complaint_created'.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RLS HARDENING ON public.complaints
-- ============================================================================
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Restrict SELECT strictly to complaint creator or verified platform admins
-- (Removes against_user = auth.uid() so complaints remain Admin-only against accused parties)
DROP POLICY IF EXISTS "Complaint participants and admins can read complaints" ON public.complaints;
DROP POLICY IF EXISTS "Complaint open-owners and admins can read complaints" ON public.complaints;
CREATE POLICY "Complaint open-owners and admins can read complaints"
ON public.complaints FOR SELECT
USING (
  opened_by = auth.uid()
  OR public.is_admin()
);

-- Enforce that against_user strictly matches the opposite participant of booking_id
-- and disallow complaints on rejected or unassigned bookings
DROP POLICY IF EXISTS "Booking participants can create complaints" ON public.complaints;
CREATE POLICY "Booking participants can create complaints"
ON public.complaints FOR INSERT
WITH CHECK (
  opened_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_id
      AND b.status::text <> 'rejected'
      AND b.worker_id IS NOT NULL
      AND (
        (b.customer_id = auth.uid() AND against_user = b.worker_id)
        OR (b.worker_id = auth.uid() AND against_user = b.customer_id)
      )
  )
);

-- ============================================================================
-- 2. DUPLICATE ACTIVE COMPLAINT GUARD (PARTIAL UNIQUE INDEX)
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS complaints_one_active_per_user_booking_idx
ON public.complaints (booking_id, opened_by)
WHERE status IN ('open', 'investigating');

-- ============================================================================
-- 3. COMPLAINT NOTIFICATION TRIGGERS (IN-APP & PUSH OUTBOX PIPELINE)
-- ============================================================================

-- Trigger A: Notify active admins when a new complaint is filed
CREATE OR REPLACE FUNCTION public.handle_complaint_created_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opener_name text;
  v_cmp_token text;
  v_booking_token text;
  v_admin record;
BEGIN
  SELECT coalesce(nullif(trim(full_name), ''), 'A user')
  INTO v_opener_name
  FROM public.profiles
  WHERE id = new.opened_by;

  v_cmp_token := upper(left(new.id::text, 8));
  v_booking_token := upper(left(new.booking_id::text, 8));

  FOR v_admin IN
    SELECT DISTINCT p.id
    FROM public.profiles p
    LEFT JOIN public.admin_roles ar ON ar.user_id = p.id
    WHERE p.role IN ('super_admin', 'sub_admin', 'admin')
       OR ar.access_level IN ('super_admin', 'admin')
  LOOP
    INSERT INTO public.notifications (
      user_id,
      booking_id,
      notification_type,
      title,
      body
    ) VALUES (
      v_admin.id,
      new.booking_id,
      'complaint_created',
      'New Complaint Filed (#CMP-' || v_cmp_token || ')',
      v_opener_name || ' filed a complaint (#CMP-' || v_cmp_token || ') regarding booking #DK-' || v_booking_token || '.'
    );
  END LOOP;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaint_created_notification ON public.complaints;
CREATE TRIGGER trg_complaint_created_notification
  AFTER INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_complaint_created_notification();

-- Trigger B: Notify complainant when status or resolution_note changes
CREATE OR REPLACE FUNCTION public.handle_complaint_updated_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cmp_token text;
  v_notif_type text;
  v_status_label text;
  v_title text;
  v_body text;
BEGIN
  IF old.status IS NOT DISTINCT FROM new.status
     AND old.resolution_note IS NOT DISTINCT FROM new.resolution_note THEN
    RETURN new;
  END IF;

  v_cmp_token := upper(left(new.id::text, 8));

  IF new.status IN ('resolved', 'dismissed') THEN
    v_notif_type := 'complaint_resolved';
  ELSE
    v_notif_type := 'complaint_updated';
  END IF;

  v_status_label := CASE new.status::text
    WHEN 'open' THEN 'Open'
    WHEN 'investigating' THEN 'Under Review'
    WHEN 'resolved' THEN 'Resolved'
    WHEN 'dismissed' THEN 'Dismissed'
    ELSE initcap(new.status::text)
  END;

  v_title := CASE
    WHEN new.status = 'resolved' THEN 'Complaint Resolved (#CMP-' || v_cmp_token || ')'
    WHEN new.status = 'dismissed' THEN 'Complaint Closed (#CMP-' || v_cmp_token || ')'
    ELSE 'Complaint Status Updated (#CMP-' || v_cmp_token || ')'
  END;

  v_body := 'Your complaint #CMP-' || v_cmp_token || ' is now ' || v_status_label || '.';
  IF nullif(trim(coalesce(new.resolution_note, '')), '') IS NOT NULL THEN
    v_body := v_body || ' Note: ' || left(trim(new.resolution_note), 160);
  END IF;

  INSERT INTO public.notifications (
    user_id,
    booking_id,
    notification_type,
    title,
    body
  ) VALUES (
    new.opened_by,
    new.booking_id,
    v_notif_type,
    v_title,
    v_body
  );

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaint_updated_notification ON public.complaints;
CREATE TRIGGER trg_complaint_updated_notification
  AFTER UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_complaint_updated_notification();

-- ============================================================================
-- 4. ENABLE PUSH NOTIFICATION QUEUEING FOR COMPLAINT EVENTS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_active_subs boolean;
  v_initial_status text;
BEGIN
  -- Restrict push delivery to eligible notification events only
  IF new.notification_type NOT IN (
    'booking_created',
    'booking_accepted',
    'booking_in_progress',
    'booking_completed',
    'booking_rejected',
    'booking_cancelled',
    'quote_received',
    'quote_accepted',
    'review_received',
    'worker_registration_submitted',
    'profile_approved',
    'profile_rejected',
    'complaint_created',
    'complaint_updated',
    'complaint_resolved'
  ) THEN
    RETURN new;
  END IF;

  -- Check if recipient has any active subscriptions
  SELECT exists (
    SELECT 1 FROM public.push_subscriptions
    WHERE user_id = new.user_id AND is_active = true
  ) INTO v_has_active_subs;

  IF v_has_active_subs THEN
    v_initial_status := 'pending';
  ELSE
    v_initial_status := 'no_subscription';
  END IF;

  INSERT INTO public.notification_push_outbox (
    notification_id,
    user_id,
    status
  ) VALUES (
    new.id,
    new.user_id,
    v_initial_status
  )
  ON CONFLICT (notification_id) DO NOTHING;

  RETURN new;
END;
$$;

-- ============================================================================
-- 5. INCLUDE 'complaint_created' IN ADMIN NOTIFICATION AUDIENCE ISOLATION
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view admin notifications" ON public.notifications;
CREATE POLICY "Admins can view admin notifications"
ON public.notifications FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    public.is_admin()
    AND notification_type IN (
      'worker_registration_submitted',
      'worker_document_uploaded',
      'complaint_created'
    )
  )
);

DROP POLICY IF EXISTS "Admins can update admin notifications" ON public.notifications;
CREATE POLICY "Admins can update admin notifications"
ON public.notifications FOR UPDATE
USING (
  user_id = auth.uid()
  OR (
    public.is_admin()
    AND notification_type IN (
      'worker_registration_submitted',
      'worker_document_uploaded',
      'complaint_created'
    )
  )
);

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
    OR n.user_id IN (
      SELECT p.id FROM public.profiles p
      LEFT JOIN public.admin_roles ar ON ar.user_id = p.id
      WHERE p.role IN ('super_admin', 'sub_admin', 'admin')
         OR ar.access_level IN ('super_admin', 'admin')
    )
  )
  AND n.notification_type IN (
    'worker_registration_submitted',
    'worker_document_uploaded',
    'complaint_created'
  )
  ORDER BY n.created_at DESC
  LIMIT limit_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_notifications(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_notifications(integer) TO authenticated, service_role;

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
          'worker_document_uploaded',
          'complaint_created'
        )
      )
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated, service_role;

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
        'worker_document_uploaded',
        'complaint_created'
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

COMMIT;

