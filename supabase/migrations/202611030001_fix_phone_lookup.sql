-- Match both canonical and legacy Indian phone formats during registration checks.
CREATE OR REPLACE FUNCTION public.check_phone_registration(lookup_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  clean_digits text;
  formatted_phone text;
  v_exists boolean := false;
BEGIN
  clean_digits := right(regexp_replace(coalesce(lookup_phone, ''), '\D', '', 'g'), 10);

  IF length(clean_digits) < 10 THEN
    RETURN jsonb_build_object(
      'registered', false,
      'error', 'Please enter a valid 10-digit mobile number'
    );
  END IF;

  formatted_phone := '+91' || clean_digits;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE phone IN (clean_digits, formatted_phone)
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('registered', true);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE phone IN (clean_digits, formatted_phone)
  ) INTO v_exists;

  RETURN jsonb_build_object('registered', v_exists);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_phone_registration(text) FROM public;
GRANT EXECUTE ON FUNCTION public.check_phone_registration(text) TO anon, authenticated, service_role;
