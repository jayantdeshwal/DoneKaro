SELECT json_build_object(
  'worker_profiles', (SELECT coalesce(json_agg(t), '[]'::json) FROM public.worker_profiles t),
  'worker_categories', (SELECT coalesce(json_agg(t), '[]'::json) FROM public.worker_categories t),
  'worker_service_areas', (SELECT coalesce(json_agg(t), '[]'::json) FROM public.worker_service_areas t),
  'profiles', (SELECT coalesce(json_agg(t), '[]'::json) FROM (SELECT id, full_name, phone, role, language, created_at FROM public.profiles) t),
  'admin_actions', (SELECT coalesce(json_agg(t), '[]'::json) FROM public.admin_actions t)
) AS backup_data;
