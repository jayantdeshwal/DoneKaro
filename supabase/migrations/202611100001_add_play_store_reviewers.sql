-- Migration: 202611100001_add_play_store_reviewers.sql
-- Description: Provision Google Play Store Reviewer Accounts & Infrastructure (+919999999999, +918888888888, +917777777777).

BEGIN;

-- 1. Ensure is_verified column exists on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 2. Ensure admin_roles table exists with foreign key to profiles(id)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'super_admin',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_admin_roles_user_id UNIQUE (user_id)
);

-- Enable RLS and permissions on admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admin_roles TO service_role, authenticated, anon;

DROP POLICY IF EXISTS "Allow read admin_roles" ON public.admin_roles;
CREATE POLICY "Allow read admin_roles" ON public.admin_roles FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow service_role manage admin_roles" ON public.admin_roles;
CREATE POLICY "Allow service_role manage admin_roles" ON public.admin_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure pgcrypto extension is active in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Temporarily disable custom guard triggers on profiles and worker_profiles to safely seed reviewer accounts
ALTER TABLE public.profiles DISABLE TRIGGER trg_guard_registration_completion;
ALTER TABLE public.profiles DISABLE TRIGGER trg_guard_profile_updates;
ALTER TABLE public.profiles DISABLE TRIGGER trg_guard_profile_inserts;
ALTER TABLE public.worker_profiles DISABLE TRIGGER trg_00_guard_worker_profile_writes;

-- 3. Provision Reviewer Accounts in auth.users, profiles, admin_roles, and worker_profiles
DO $$
DECLARE
  v_cust_id uuid;
  v_work_id uuid;
  v_admin_id uuid;
BEGIN
  -- Set search path to include extensions for crypt and gen_salt
  SET LOCAL search_path = public, auth, extensions;
  PERFORM set_config('donekaro.completing_registration', 'true', true);
  -- =========================================================================
  -- A. CUSTOMER REVIEWER: +919999999999
  -- =========================================================================
  SELECT id INTO v_cust_id FROM auth.users 
  WHERE phone IN ('+919999999999', '9999999999') OR lower(email) = 'reviewer@donekaro.com' 
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM public.profiles 
    WHERE phone IN ('+919999999999', '9999999999') OR lower(email) = 'reviewer@donekaro.com' 
    LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    v_cust_id := '99999999-9999-4999-9999-999999999999'::uuid;
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, phone, phone_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_cust_id, 'authenticated', 'authenticated',
      'reviewer@donekaro.com', extensions.crypt('ReviewerPass123!', extensions.gen_salt('bf')),
      now(), '+919999999999', now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Google Play Reviewer (Customer)","phone":"+919999999999","role":"customer"}'::jsonb,
      now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = '+919999999999',
      phone_confirmed_at = coalesce(auth.users.phone_confirmed_at, now()),
      updated_at = now();
  ELSE
    UPDATE auth.users
    SET phone = '+919999999999',
        phone_confirmed_at = coalesce(phone_confirmed_at, now()),
        email = coalesce(email, 'reviewer@donekaro.com'),
        updated_at = now()
    WHERE id = v_cust_id;
  END IF;

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

  INSERT INTO public.profiles (
    id, full_name, phone, email, role, is_verified, registration_completed, created_at, updated_at
  ) VALUES (
    v_cust_id, 'Google Play Reviewer (Customer)', '+919999999999', 'reviewer@donekaro.com', 'customer', true, true, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = 'customer',
    is_verified = true,
    registration_completed = true,
    updated_at = now();

  -- =========================================================================
  -- B. WORKER REVIEWER: +918888888888 (role: 'worker', is_verified: true)
  -- =========================================================================
  SELECT id INTO v_work_id FROM auth.users 
  WHERE phone IN ('+918888888888', '8888888888') OR lower(email) = '8888888888@phone.donekaro.local' 
  LIMIT 1;

  IF v_work_id IS NULL THEN
    SELECT id INTO v_work_id FROM public.profiles 
    WHERE phone IN ('+918888888888', '8888888888') 
    LIMIT 1;
  END IF;

  IF v_work_id IS NULL THEN
    v_work_id := '88888888-8888-4888-8888-888888888888'::uuid;
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, phone, phone_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_work_id, 'authenticated', 'authenticated',
      '8888888888@phone.donekaro.local', extensions.crypt('ReviewerPass123!', extensions.gen_salt('bf')),
      now(), '+918888888888', now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Google Play Reviewer (Worker)","phone":"+918888888888","role":"worker"}'::jsonb,
      now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = '+918888888888',
      phone_confirmed_at = coalesce(auth.users.phone_confirmed_at, now()),
      updated_at = now();
  ELSE
    UPDATE auth.users
    SET phone = '+918888888888',
        phone_confirmed_at = coalesce(phone_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_work_id;
  END IF;

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

  INSERT INTO public.profiles (
    id, full_name, phone, email, role, is_verified, registration_completed, created_at, updated_at
  ) VALUES (
    v_work_id, 'Google Play Reviewer (Worker)', '+918888888888', '8888888888@phone.donekaro.local', 'worker', true, true, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = 'worker',
    is_verified = true,
    registration_completed = true,
    updated_at = now();

  -- Ensure worker_profiles record exists and is approved/available
  INSERT INTO public.worker_profiles (
    id, bio, experience_years, approval_status, is_available, approved_at, rating, review_count, updated_at
  ) VALUES (
    v_work_id, 'Certified Master Technician - Google Play Reviewer', 5, 'approved', true, now(), 5.0, 12, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    approval_status = 'approved',
    is_available = true,
    updated_at = now();

  -- Ensure worker has category mapped
  INSERT INTO public.worker_categories (worker_id, category_id)
  VALUES (v_work_id, 'ac_repair')
  ON CONFLICT (worker_id, category_id) DO NOTHING;

  -- Ensure worker has service area mapped
  INSERT INTO public.worker_service_areas (worker_id, service_area_id)
  SELECT v_work_id, id FROM public.service_areas LIMIT 1
  ON CONFLICT (worker_id, service_area_id) DO NOTHING;

  -- =========================================================================
  -- C. ADMIN REVIEWER: +917777777777 (role: 'admin', admin_roles: 'super_admin')
  -- =========================================================================
  SELECT id INTO v_admin_id FROM auth.users 
  WHERE phone IN ('+917777777777', '7777777777') OR lower(email) = '7777777777@phone.donekaro.local' 
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles 
    WHERE phone IN ('+917777777777', '7777777777') 
    LIMIT 1;
  END IF;

  IF v_admin_id IS NULL THEN
    v_admin_id := '77777777-7777-4777-7777-777777777777'::uuid;
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, phone, phone_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      '7777777777@phone.donekaro.local', extensions.crypt('ReviewerPass123!', extensions.gen_salt('bf')),
      now(), '+917777777777', now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Google Play Reviewer (Admin)","phone":"+917777777777","role":"admin"}'::jsonb,
      now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = '+917777777777',
      phone_confirmed_at = coalesce(auth.users.phone_confirmed_at, now()),
      updated_at = now();
  ELSE
    UPDATE auth.users
    SET phone = '+917777777777',
        phone_confirmed_at = coalesce(phone_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_admin_id;
  END IF;

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

  -- Upsert profiles for admin (+917777777777)
  INSERT INTO public.profiles (
    id, full_name, phone, email, role, is_verified, registration_completed, created_at, updated_at
  ) VALUES (
    v_admin_id, 'Google Play Reviewer (Admin)', '+917777777777', '7777777777@phone.donekaro.local', 'admin', true, true, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = 'admin',
    is_verified = true,
    registration_completed = true,
    updated_at = now();

  -- CRITICAL: Upsert into admin_roles setting access_level = 'super_admin'
  -- Dependent on profiles insert above to satisfy foreign key constraint!
  INSERT INTO public.admin_roles (user_id, admin_id, access_level, updated_at)
  VALUES (v_admin_id, v_admin_id, 'super_admin', now())
  ON CONFLICT (user_id) DO UPDATE SET
    admin_id = EXCLUDED.admin_id,
    access_level = 'super_admin',
    updated_at = now();

END;
$$;

-- Re-enable custom guard triggers on profiles and worker_profiles
ALTER TABLE public.profiles ENABLE TRIGGER trg_guard_registration_completion;
ALTER TABLE public.profiles ENABLE TRIGGER trg_guard_profile_updates;
ALTER TABLE public.profiles ENABLE TRIGGER trg_guard_profile_inserts;
ALTER TABLE public.worker_profiles ENABLE TRIGGER trg_00_guard_worker_profile_writes;

COMMIT;

