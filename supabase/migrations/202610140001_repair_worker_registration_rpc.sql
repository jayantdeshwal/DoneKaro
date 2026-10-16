BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.register_worker(text,text,text,integer,text,text[],text,text,text[])') IS NULL THEN
    RAISE EXCEPTION 'Expected 9-arg register_worker is missing';
  END IF;
  IF (SELECT count(*) FROM public.categories WHERE parent_category_id IS NULL) <> 5 THEN
    RAISE EXCEPTION 'Expected exactly 5 top-level categories';
  END IF;
  IF EXISTS (SELECT 1 FROM public.worker_categories GROUP BY worker_id HAVING count(*) > 2) THEN
    RAISE EXCEPTION 'Existing worker has more than 2 services; resolve first';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.register_worker(text,text,text,integer,text,text[],text,text);

CREATE OR REPLACE FUNCTION public.register_worker(
  worker_name text,
  worker_phone text,
  worker_bio text,
  worker_experience integer,
  worker_category_id text DEFAULT NULL,
  worker_area_pincodes text[] DEFAULT ARRAY[]::text[],
  worker_avatar_url text DEFAULT NULL,
  worker_id_proof_url text DEFAULT NULL,
  worker_category_ids text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_cats text[];
  v_count integer;
  v_matched integer;
  v_parents integer;
  v_parent_id text;
  v_proof text;
  v_pins text[];
  v_area_ids uuid[];
  v_req_areas integer;
  v_matched_areas integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to register as a worker';
  END IF;

  SELECT role::text INTO v_role FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF v_role NOT IN ('customer', 'worker') THEN
    RAISE EXCEPTION 'This account type cannot register as a worker';
  END IF;

  IF nullif(trim(worker_name), '') IS NULL THEN
    RAISE EXCEPTION 'Worker name is required';
  END IF;
  IF worker_experience IS NULL OR worker_experience < 0 OR worker_experience > 50 THEN
    RAISE EXCEPTION 'Experience must be between 0 and 50 years';
  END IF;

  IF worker_category_ids IS NOT NULL AND coalesce(array_length(worker_category_ids, 1), 0) > 0 THEN
    SELECT array_agg(DISTINCT trim(c)) INTO v_cats
    FROM unnest(worker_category_ids) AS c WHERE trim(c) <> '';
    IF nullif(trim(worker_category_id), '') IS NOT NULL
       AND NOT (trim(worker_category_id) = ANY(coalesce(v_cats, ARRAY[]::text[]))) THEN
      RAISE EXCEPTION 'Primary service must be one of the selected services';
    END IF;
  ELSIF nullif(trim(worker_category_id), '') IS NOT NULL THEN
    v_cats := ARRAY[trim(worker_category_id)];
  END IF;

  v_count := coalesce(array_length(v_cats, 1), 0);
  IF v_count < 1 OR v_count > 2 THEN
    RAISE EXCEPTION 'Select 1 or 2 services (requested: %)', v_count;
  END IF;

  SELECT count(*)::integer, count(DISTINCT parent_category_id)::integer, min(parent_category_id)
    INTO v_matched, v_parents, v_parent_id
  FROM public.categories WHERE id = ANY(v_cats);

  IF v_matched <> v_count THEN
    RAISE EXCEPTION 'One or more selected services are invalid';
  END IF;
  IF EXISTS (SELECT 1 FROM public.categories WHERE id = ANY(v_cats) AND parent_category_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot select a top-level group as a service';
  END IF;
  IF v_parents <> 1 OR v_parent_id IS NULL THEN
    RAISE EXCEPTION 'All selected services must belong to the same parent category';
  END IF;

  SELECT array_agg(DISTINCT trim(p)) INTO v_pins
  FROM unnest(coalesce(worker_area_pincodes, ARRAY[]::text[])) AS p WHERE trim(p) <> '';
  v_req_areas := coalesce(array_length(v_pins, 1), 0);
  SELECT array_agg(id ORDER BY pincode), count(*)::integer INTO v_area_ids, v_matched_areas
  FROM public.service_areas WHERE pincode = ANY(coalesce(v_pins, ARRAY[]::text[]));
  IF v_req_areas = 0 OR v_matched_areas <> v_req_areas THEN
    RAISE EXCEPTION 'One or more service areas are invalid';
  END IF;

  v_proof := nullif(trim(worker_id_proof_url), '');
  IF v_proof IS NOT NULL AND (v_proof NOT LIKE v_uid::text || '/%' OR v_proof LIKE '%..%') THEN
    RAISE EXCEPTION 'Invalid ID document path';
  END IF;

  PERFORM set_config('jugnu.worker_registration_in_progress', 'true', true);
  UPDATE public.profiles
  SET full_name = trim(worker_name),
      phone = nullif(trim(worker_phone), ''),
      role = 'worker',
      avatar_url = coalesce(nullif(trim(worker_avatar_url), ''), avatar_url),
      updated_at = timezone('utc', now())
  WHERE id = v_uid;
  PERFORM set_config('jugnu.worker_registration_in_progress', 'false', true);

  INSERT INTO public.worker_profiles
    (id, bio, experience_years, approval_status, rejection_reason, is_available, id_proof_url, updated_at)
  VALUES
    (v_uid, coalesce(worker_bio, ''), worker_experience, 'pending', null, true, v_proof, timezone('utc', now()))
  ON CONFLICT (id) DO UPDATE SET
    bio = excluded.bio,
    experience_years = excluded.experience_years,
    approval_status = CASE WHEN public.worker_profiles.approval_status::text = 'rejected'
                           THEN 'pending' ELSE public.worker_profiles.approval_status END,
    rejection_reason = CASE WHEN public.worker_profiles.approval_status::text = 'rejected'
                            THEN null ELSE public.worker_profiles.rejection_reason END,
    id_proof_url = coalesce(excluded.id_proof_url, public.worker_profiles.id_proof_url),
    updated_at = timezone('utc', now());

  DELETE FROM public.worker_categories WHERE worker_id = v_uid;
  INSERT INTO public.worker_categories (worker_id, category_id)
  SELECT v_uid, unnest(v_cats);

  DELETE FROM public.worker_service_areas WHERE worker_id = v_uid;
  INSERT INTO public.worker_service_areas (worker_id, service_area_id)
  SELECT v_uid, unnest(v_area_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.register_worker(text,text,text,integer,text,text[],text,text,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_worker(text,text,text,integer,text,text[],text,text,text[]) TO authenticated, service_role;

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM pg_proc
  WHERE proname = 'register_worker' AND pronamespace = 'public'::regnamespace;
  IF n <> 1 THEN RAISE EXCEPTION 'Expected exactly 1 register_worker, found %', n; END IF;
  IF has_function_privilege('anon', 'public.register_worker(text,text,text,integer,text,text[],text,text,text[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute register_worker';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.register_worker(text,text,text,integer,text,text[],text,text,text[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated cannot execute register_worker';
  END IF;
END $$;

COMMIT;
