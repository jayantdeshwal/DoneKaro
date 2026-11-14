-- ============================================================================
-- Migration: 202611100002_add_reviewer_identities.sql
-- Description: Provision auth.identities records for Google Play reviewer accounts
--              Required for Supabase GoTrue to recognize accounts and generate magiclink sessions.
-- ============================================================================

DO $$
DECLARE
  v_cust_id uuid;
  v_work_id uuid;
  v_admin_id uuid;
BEGIN
  -- Customer: +919999999999
  SELECT id INTO v_cust_id FROM auth.users WHERE phone = '+919999999999' OR email = 'reviewer@donekaro.com' LIMIT 1;
  IF v_cust_id IS NOT NULL THEN
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_cust_id,
      v_cust_id::text,
      v_cust_id,
      jsonb_build_object('sub', v_cust_id::text, 'email', 'reviewer@donekaro.com', 'email_verified', true, 'phone_verified', true),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = now();
  END IF;

  -- Worker: +918888888888
  SELECT id INTO v_work_id FROM auth.users WHERE phone = '+918888888888' OR email = '8888888888@phone.donekaro.local' LIMIT 1;
  IF v_work_id IS NOT NULL THEN
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_work_id,
      v_work_id::text,
      v_work_id,
      jsonb_build_object('sub', v_work_id::text, 'email', '8888888888@phone.donekaro.local', 'email_verified', true, 'phone_verified', true),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = now();
  END IF;

  -- Admin: +917777777777
  SELECT id INTO v_admin_id FROM auth.users WHERE phone = '+917777777777' OR email = '7777777777@phone.donekaro.local' LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_admin_id,
      v_admin_id::text,
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', '7777777777@phone.donekaro.local', 'email_verified', true, 'phone_verified', true),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = now();
  END IF;

END $$;

