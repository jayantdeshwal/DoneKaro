-- ============================================================================
-- Migration: 202609250002_fix_notification_participant_rls.sql
-- Description: Removes broad `is_admin()` bypass from participant SELECT policy
-- on `public.notifications`.
--
-- Prior state:
-- Policy "Users can read their notifications" had:
--   USING (user_id = auth.uid() OR is_admin())
-- Which combined with permissive OR semantics to grant administrators an
-- unrestricted SELECT bypass across all customer and worker notifications.
--
-- Corrected state:
-- Policy "Users can read their notifications" is strictly scoped to:
--   USING (user_id = auth.uid())
--
-- Combined with policy "Admins can view admin notifications":
--   USING (user_id = auth.uid() OR (is_admin() AND notification_type IN (...)))
-- Administrators can only SELECT their own notifications or verified
-- admin-targeted notification types ('worker_registration_submitted',
-- 'worker_document_uploaded').
-- ============================================================================

DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;

CREATE POLICY "Users can read their notifications"
ON public.notifications
FOR SELECT
USING (
  user_id = auth.uid()
);
