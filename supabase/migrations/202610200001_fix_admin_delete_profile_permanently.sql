CREATE OR REPLACE FUNCTION public.admin_delete_profile_permanently(target_profile_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin_id uuid;
  v_target_uuid uuid;
  v_target_role text;
  v_target_name text;
  v_target_phone text;
  v_deleted_bookings_count integer := 0;
  v_deleted_reviews_count integer := 0;
BEGIN
  PERFORM public.require_admin_2fa();

  v_admin_id := auth.uid();

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can permanently delete accounts.';
  END IF;

  BEGIN
    v_target_uuid := target_profile_id::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid profile ID format: %', target_profile_id;
  END;

  IF v_target_uuid = v_admin_id THEN
    RAISE EXCEPTION 'Action prohibited: Administrators cannot delete their own profile from the admin console.';
  END IF;

  SELECT role::text, full_name, phone
  INTO v_target_role, v_target_name, v_target_phone
  FROM public.profiles
  WHERE id = v_target_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found with ID: %', target_profile_id;
  END IF;

  IF v_target_uuid = public.get_super_admin_uuid() OR v_target_role = 'super_admin' THEN
    RAISE EXCEPTION 'Action prohibited: The Super Administrator account cannot be deleted.';
  END IF;

  IF v_target_role IN ('sub_admin', 'admin') AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Action prohibited: Only the Super Administrator can delete administrator accounts.';
  END IF;

  DELETE FROM public.booking_receipts
  WHERE customer_id = v_target_uuid 
     OR worker_id = v_target_uuid
     OR booking_id IN (
       SELECT id FROM public.bookings WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid
     );

  DELETE FROM public.booking_payments
  WHERE customer_id = v_target_uuid 
     OR worker_id = v_target_uuid
     OR booking_id IN (
       SELECT id FROM public.bookings WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid
     );

  DELETE FROM public.booking_change_requests
  WHERE worker_id = v_target_uuid
     OR booking_id IN (
       SELECT id FROM public.bookings WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid
     );

  DELETE FROM public.booking_quotes
  WHERE worker_id = v_target_uuid
     OR booking_id IN (
       SELECT id FROM public.bookings WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid
     );

  DELETE FROM public.booking_quote_requests
  WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid;

  DELETE FROM public.customer_service_active_slots
  WHERE customer_id = v_target_uuid
     OR booking_id IN (
       SELECT id FROM public.bookings WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid
     );

  DELETE FROM public.service_request_attachments
  WHERE service_request_id IN (
    SELECT id
    FROM public.service_requests
    WHERE customer_id = v_target_uuid
  );

  DELETE FROM public.service_requests
  WHERE customer_id = v_target_uuid;

  DELETE FROM public.complaints
  WHERE opened_by = v_target_uuid
     OR against_user = v_target_uuid
     OR booking_id IN (
       SELECT id
       FROM public.bookings
       WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid
     );

  DELETE FROM public.reviews
  WHERE customer_id = v_target_uuid
     OR worker_id = v_target_uuid
     OR booking_id IN (
       SELECT id
       FROM public.bookings
       WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid
     );
  GET DIAGNOSTICS v_deleted_reviews_count = ROW_COUNT;

  DELETE FROM public.notifications
  WHERE user_id = v_target_uuid
     OR booking_id IN (
       SELECT id
       FROM public.bookings
       WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid
     );

  DELETE FROM public.bookings
  WHERE customer_id = v_target_uuid OR worker_id = v_target_uuid;
  GET DIAGNOSTICS v_deleted_bookings_count = ROW_COUNT;

  DELETE FROM public.worker_service_areas
  WHERE worker_id = v_target_uuid;

  DELETE FROM public.worker_categories
  WHERE worker_id = v_target_uuid;

  DELETE FROM public.worker_profiles
  WHERE id = v_target_uuid;

  DELETE FROM public.admin_actions
  WHERE admin_id = v_target_uuid;

  DELETE FROM public.admin_2fa_sessions
  WHERE admin_id = v_target_uuid;

  DELETE FROM public.profiles
  WHERE id = v_target_uuid;

  DELETE FROM auth.users
  WHERE id = v_target_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', target_profile_id,
    'role', v_target_role,
    'name', v_target_name,
    'phone', v_target_phone,
    'deleted_bookings', v_deleted_bookings_count,
    'deleted_reviews', v_deleted_reviews_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_profile_permanently(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_profile_permanently(text) TO authenticated, service_role;
