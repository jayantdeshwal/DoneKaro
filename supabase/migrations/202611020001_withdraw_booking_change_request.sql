ALTER TABLE public.booking_change_requests
  DROP CONSTRAINT booking_change_requests_status_check;

ALTER TABLE public.booking_change_requests
  ADD CONSTRAINT booking_change_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'withdrawn'));

ALTER TABLE public.booking_change_requests
  DROP CONSTRAINT booking_change_requests_decision_timestamp;

ALTER TABLE public.booking_change_requests
  ADD CONSTRAINT booking_change_requests_decision_timestamp
  CHECK (
    (status = 'pending' AND decided_at IS NULL)
    OR (status IN ('approved', 'rejected', 'cancelled', 'withdrawn') AND decided_at IS NOT NULL)
  );

CREATE OR REPLACE FUNCTION public.withdraw_booking_change_request(target_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_worker_id uuid;
  v_request_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to withdraw an additional-charge request';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'worker'
  ) THEN
    RAISE EXCEPTION 'Only workers can withdraw an additional-charge request';
  END IF;

  SELECT r.worker_id, r.status
  INTO v_worker_id, v_request_status
  FROM public.booking_change_requests r
  WHERE r.id = target_request_id
  FOR UPDATE;

  IF v_worker_id IS NULL OR v_worker_id <> auth.uid() THEN
    RAISE EXCEPTION 'Request was not found or does not belong to you';
  END IF;

  IF v_request_status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending additional-charge requests can be withdrawn';
  END IF;

  UPDATE public.booking_change_requests
  SET status = 'withdrawn',
      decided_at = timezone('utc', now())
  WHERE id = target_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.withdraw_booking_change_request(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_booking_change_request(uuid) TO authenticated;
