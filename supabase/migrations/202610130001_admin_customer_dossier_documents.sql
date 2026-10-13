-- Phase 22: Admin Customer Dossier Address Proof Retrieval
-- Updates get_admin_customers() RPC to include address_proof_url
-- Preserves 2FA check, column ordering, metrics, and role checks

alter table public.profiles
add column if not exists address_proof_url text;

drop function if exists public.get_admin_customers();
create or replace function public.get_admin_customers()
returns table (
  id                  uuid,
  name                text,
  phone               text,
  avatar_url          text,
  address_proof_url   text,
  created_at          timestamptz,
  total_bookings      bigint,
  completed_bookings  bigint,
  active_bookings     bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin_2fa();

  return query
  select
    p.id,
    p.full_name::text                                                                as name,
    p.phone::text                                                                    as phone,
    p.avatar_url::text                                                               as avatar_url,
    p.address_proof_url::text                                                        as address_proof_url,
    p.created_at,
    count(b.id)                                                                      as total_bookings,
    count(b.id) filter (where b.status = 'completed')                               as completed_bookings,
    count(b.id) filter (where b.status in ('pending', 'accepted', 'in_progress'))   as active_bookings
  from public.profiles p
  left join public.bookings b on b.customer_id = p.id
  where p.role = 'customer'
  group by p.id, p.full_name, p.phone, p.avatar_url, p.address_proof_url, p.created_at
  order by p.created_at desc;
end;
$$;

revoke execute on function public.get_admin_customers() from public, anon;
grant execute on function public.get_admin_customers() to authenticated, service_role;
