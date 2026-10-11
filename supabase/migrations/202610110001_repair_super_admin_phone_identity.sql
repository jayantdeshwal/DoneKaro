-- Migration: 202610110001_repair_super_admin_phone_identity.sql
-- Description: Authoritative Super-Admin Phone Identity Restoration.
-- Purpose:
--   Binds the founder's verified mobile number (+918077362606) to the authoritative
--   Super-Admin profile ('3216cdd3-aaea-45ab-944c-cfb30d6a6e0b').
--   Resolves any conflict caused by accidental disposable customer records created
--   prior to administrator phone identity binding.
--
-- Safety Guarantees:
--   - Scoped strictly to the authoritative Super-Admin UUID (public.get_super_admin_uuid()).
--   - Does NOT elevate any customer or create replacement administrator accounts.
--   - Transaction-safe and idempotent.

BEGIN;

DO $$
DECLARE
  v_founder_id      uuid;
  v_target_phone    text := '+918077362606';
  v_clean_phone     text := '8077362606';
  v_conflict_user_id uuid;
BEGIN
  -- 1. Obtain immutable Super-Admin UUID
  v_founder_id := public.get_super_admin_uuid();

  IF v_founder_id IS NULL THEN
    RAISE EXCEPTION 'Super-Admin UUID getter returned NULL. Aborting repair.';
  END IF;

  -- 2. Detect any accidental duplicate customer profile holding the founder's phone
  SELECT id INTO v_conflict_user_id
  FROM public.profiles
  WHERE (phone = v_target_phone OR phone = v_clean_phone)
    AND id <> v_founder_id
  LIMIT 1;

  IF v_conflict_user_id IS NOT NULL THEN
    -- Safely detach phone to resolve unique constraint without deleting any account
    UPDATE public.profiles
    SET phone = NULL,
        updated_at = timezone('utc', now())
    WHERE id = v_conflict_user_id;
  END IF;

  -- 3. Clean up any duplicate auth.users phone binding
  UPDATE auth.users
  SET phone = NULL
  WHERE (phone = v_target_phone OR phone = v_clean_phone)
    AND id <> v_founder_id;

  -- 4. Authoritatively bind verified phone to Super-Admin profile
  UPDATE public.profiles
  SET phone = v_target_phone,
      updated_at = timezone('utc', now())
  WHERE id = v_founder_id
    AND role = 'super_admin';

  -- 5. Authoritatively bind verified phone to Super-Admin auth.users record
  UPDATE auth.users
  SET phone = v_target_phone,
      phone_confirmed_at = coalesce(phone_confirmed_at, now()),
      updated_at = now()
  WHERE id = v_founder_id;

  -- 6. Log the audit event in admin_actions
  INSERT INTO public.admin_actions (admin_id, action, target_table, target_id, details)
  VALUES (
    v_founder_id,
    'repair_super_admin_phone_identity',
    'profiles',
    v_founder_id,
    jsonb_build_object(
      'repaired_phone', '+91******06',
      'super_admin_id', v_founder_id,
      'conflict_user_resolved', v_conflict_user_id IS NOT NULL,
      'timestamp', now()
    )
  );

END;
$$;

COMMIT;
