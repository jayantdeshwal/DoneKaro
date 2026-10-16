SELECT 
    schemaname, 
    relname AS tablename, 
    n_live_tup AS estimated_rows
FROM pg_stat_user_tables 
ORDER BY schemaname, relname;

SELECT * FROM public.admin_actions LIMIT 5;
