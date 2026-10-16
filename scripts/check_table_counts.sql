SELECT
    schemaname,
    relname as tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY relname;
