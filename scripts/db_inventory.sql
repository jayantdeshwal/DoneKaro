SELECT 'auth.users' AS tbl, count(*) AS cnt FROM auth.users
UNION ALL SELECT 'public.profiles', count(*) FROM public.profiles
UNION ALL SELECT 'public.worker_profiles', count(*) FROM public.worker_profiles
UNION ALL SELECT 'public.worker_categories', count(*) FROM public.worker_categories
UNION ALL SELECT 'public.worker_service_areas', count(*) FROM public.worker_service_areas
UNION ALL SELECT 'public.bookings', count(*) FROM public.bookings
UNION ALL SELECT 'public.booking_quotes', count(*) FROM public.booking_quotes
UNION ALL SELECT 'public.booking_receipts', count(*) FROM public.booking_receipts
UNION ALL SELECT 'public.booking_change_requests', count(*) FROM public.booking_change_requests
UNION ALL SELECT 'public.reviews', count(*) FROM public.reviews
UNION ALL SELECT 'public.complaints', count(*) FROM public.complaints
UNION ALL SELECT 'public.notifications', count(*) FROM public.notifications
UNION ALL SELECT 'public.admin_actions', count(*) FROM public.admin_actions
UNION ALL SELECT 'public.admin_2fa_sessions', count(*) FROM public.admin_2fa_sessions
UNION ALL SELECT 'public.categories', count(*) FROM public.categories
UNION ALL SELECT 'public.service_areas', count(*) FROM public.service_areas;
