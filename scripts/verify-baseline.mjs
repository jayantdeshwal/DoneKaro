import fs from 'node:fs'

const expected = `CREATE OR REPLACE FUNCTION public.register_worker(worker_name text, worker_phone text, worker_bio text, worker_experience integer, worker_category_id text DEFAULT NULL::text, worker_area_pincodes text[] DEFAULT ARRAY[]::text[], worker_avatar_url text DEFAULT NULL::text, worker_id_proof_url text DEFAULT NULL::text, worker_category_ids text[] DEFAULT NULL::text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_final_categories text[];
  v_count integer;
  v_matched_count integer;
  v_parent_count integer;
  v_parent_id text;
  requested_area_count integer;
  matched_area_count integer;
  area_ids uuid[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to register as a worker';
  END IF;

  IF nullif(trim(worker_name), '') IS NULL THEN
    RAISE EXCEPTION 'Worker name is required';
  END IF;

  IF worker_experience < 0 OR worker_experience > 50 THEN
    RAISE EXCEPTION 'Experience must be between 0 and 50 years';
  END IF;

  -- 1. Consolidate requested services from worker_category_ids or legacy worker_category_id
  IF worker_category_ids IS NOT NULL AND array_length(worker_category_ids, 1) > 0 THEN
    SELECT array_agg(DISTINCT trim(c))
      INTO v_final_categories
    FROM unnest(worker_category_ids) AS c
    WHERE trim(c) <> '';
  ELSIF worker_category_id IS NOT NULL AND trim(worker_category_id) <> '' THEN
    v_final_categories := ARRAY[trim(worker_category_id)];
  ELSE
    RAISE EXCEPTION 'Please select at least one work service';
  END IF;

  v_count := coalesce(array_length(v_final_categories, 1), 0);

  -- 2. Strict Service Count Invariant: between 1 and 2 services
  IF v_count < 1 OR v_count > 2 THEN
    RAISE EXCEPTION 'A worker may select at most 2 services (requested: %)', v_count;
  END IF;

  -- 3. Verify all selected services exist in public.categories AND are leaf services
  SELECT count(*)::integer, count(DISTINCT parent_category_id)::integer, min(parent_category_id)
    INTO v_matched_count, v_parent_count, v_parent_id
  FROM public.categories
  WHERE id = ANY(v_final_categories);

  IF v_matched_count <> v_count THEN
    RAISE EXCEPTION 'One or more selected services are invalid';
  END IF;

  -- Prevent choosing a top-level parent category itself as a service
  IF EXISTS (
    SELECT 1 FROM public.categories 
    WHERE id = ANY(v_final_categories) AND parent_category_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot select a top-level trade group as a service. Please select specific services.';
  END IF;

  -- 4. Strict Single Parent Category Invariant: All services must share the exact same parent_category_id
  IF v_parent_count <> 1 OR v_parent_id IS NULL THEN
    RAISE EXCEPTION 'All selected services must belong to the exact same parent category';
  END IF;

  -- Validate service areas
  requested_area_count := coalesce(array_length(worker_area_pincodes, 1), 0);
  SELECT array_agg(id ORDER BY pincode), count(*)::integer
    INTO area_ids, matched_area_count
  FROM public.service_areas
  WHERE pincode = ANY(worker_area_pincodes);

  IF requested_area_count = 0 OR matched_area_count <> requested_area_count THEN
    RAISE EXCEPTION 'One or more service areas are invalid';
  END IF;

  -- Set transaction-local configuration flag to permit role transition to worker
  PERFORM set_config('jugnu.worker_registration_in_progress', 'true', true);

  -- Update profiles with name, phone, role, and optional avatar_url
  UPDATE public.profiles
  SET
    full_name = trim(worker_name),
    phone = nullif(trim(worker_phone), ''),
    role = 'worker',
    avatar_url = coalesce(nullif(trim(worker_avatar_url), ''), avatar_url),
    updated_at = timezone('utc', now())
  WHERE id = auth.uid();

  -- Upsert worker_profiles with bio, experience, and optional id_proof_url
  INSERT INTO public.worker_profiles (
    id,
    bio,
    experience_years,
    approval_status,
    rejection_reason,
    is_available,
    id_proof_url,
    updated_at
  ) VALUES (
    auth.uid(),
    coalesce(worker_bio, ''),
    worker_experience,
    'pending',
    null,
    true,
    nullif(trim(worker_id_proof_url), ''),
    timezone('utc', now())
  )
  ON CONFLICT (id) DO UPDATE SET
    bio = excluded.bio,
    experience_years = excluded.experience_years,
    approval_status = 'pending',
    rejection_reason = null,
    id_proof_url = coalesce(excluded.id_proof_url, public.worker_profiles.id_proof_url),
    updated_at = timezone('utc', now());

  -- Update categories with ALL selected services (1 or 2)
  DELETE FROM public.worker_categories WHERE worker_id = auth.uid();
  INSERT INTO public.worker_categories (worker_id, category_id)
  SELECT auth.uid(), unnest(v_final_categories);

  -- Update service areas
  DELETE FROM public.worker_service_areas WHERE worker_id = auth.uid();
  INSERT INTO public.worker_service_areas (worker_id, service_area_id)
  SELECT auth.uid(), unnest(area_ids);
END;
$function$`

const actual = fs.readFileSync('scripts/rollback_baseline_live_register_worker.sql', 'utf8').replace(/\r\n/g, '\n').trim()
const expNorm = expected.replace(/\r\n/g, '\n').trim()

if (actual === expNorm) {
  console.log('EXACT_MATCH_VERIFIED: 100% byte & character match with prompt text.')
  console.log(`Length: ${actual.length} characters`)
} else {
  console.error('MISMATCH_DETECTED')
  process.exit(1)
}
