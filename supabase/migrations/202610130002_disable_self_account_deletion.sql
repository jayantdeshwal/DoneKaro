-- Phase 23: Safe Account Deletion Governance & Restriction of Self-Service Deletion
-- Ensures ordinary customers and workers cannot execute self-service account deletion.
-- Preserves existing administrator-driven profile deletion via public.admin_delete_profile_permanently().

-- If public.delete_own_account was deployed or exists, explicitly revoke all execution privileges and drop it.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'delete_own_account'
  ) then
    execute 'revoke all on function public.delete_own_account() from public, anon, authenticated;';
    execute 'drop function public.delete_own_account();';
  end if;
end $$;
