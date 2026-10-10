-- Phase 17: Customer Address Proof Storage Bucket, Profile Column & Server-Authoritative Registration Security
-- 1. Add address_proof_url and registration_completed columns to public.profiles
-- 2. Provision private 'customer-documents' storage bucket
-- 3. Set RLS policies on storage.objects for 'customer-documents' (owners & admins only)
-- 4. Authoritative complete_customer_registration RPC verifying storage object existence & ownership
-- 5. Trigger defense preventing direct client modification of registration_completed

-- 1. Add address_proof_url and registration_completed columns to public.profiles
alter table public.profiles
add column if not exists address_proof_url text;

alter table public.profiles
add column if not exists registration_completed boolean not null default true;

-- 2. Provision private 'customer-documents' storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-documents',
  'customer-documents',
  false,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. RLS Policies on storage.objects for customer-documents

-- Insert: Only authenticated users can upload to their own folder: {auth.uid()}/...
drop policy if exists "Customers can upload address proof" on storage.objects;
create policy "Customers can upload address proof"
on storage.objects for insert
with check (
  bucket_id = 'customer-documents'
  and auth.role() = 'authenticated'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or auth.uid()::text = split_part(name, '/', 1)
  )
);

-- Select: Only document owners and administrators can view/download
drop policy if exists "Admins and owners can view customer documents" on storage.objects;
create policy "Admins and owners can view customer documents"
on storage.objects for select
using (
  bucket_id = 'customer-documents'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
    or auth.uid()::text = split_part(name, '/', 1)
  )
);

-- Delete: Only document owners and administrators can delete
drop policy if exists "Admins and owners can delete customer documents" on storage.objects;
create policy "Admins and owners can delete customer documents"
on storage.objects for delete
using (
  bucket_id = 'customer-documents'
  and (
    public.is_admin()
    or auth.uid()::text = (storage.foldername(name))[1]
    or auth.uid()::text = split_part(name, '/', 1)
  )
);

-- 4. Authoritative complete_customer_registration RPC verifying storage object existence & ownership
create or replace function public.complete_customer_registration(p_address_proof_path text)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_user_id uuid := auth.uid();
  v_clean_path text;
  v_object_exists boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required to complete registration.';
  end if;

  v_clean_path := trim(p_address_proof_path);
  if v_clean_path is null or length(v_clean_path) < 3 then
    raise exception 'A valid address proof storage path is mandatory.';
  end if;

  -- Strip bucket prefix if provided in storage path
  if v_clean_path like 'customer-documents/%' then
    v_clean_path := substring(v_clean_path from 20);
  end if;

  -- Verify path ownership: must belong to the caller's uuid folder
  if not (
    v_clean_path like (v_user_id::text || '/%')
    or split_part(v_clean_path, '/', 1) = v_user_id::text
  ) then
    raise exception 'Unauthorized: Document path must belong to the authenticated user folder.';
  end if;

  -- Verify document exists in storage.objects under customer-documents bucket
  select exists (
    select 1 from storage.objects
    where bucket_id = 'customer-documents'
      and name = v_clean_path
  ) into v_object_exists;

  if not v_object_exists then
    raise exception 'Address proof document not found in storage. Upload must precede registration completion.';
  end if;

  -- Authoritatively set session context setting so the update guard trigger allows completion
  perform set_config('donekaro.completing_registration', 'true', true);

  update public.profiles
  set address_proof_url = v_clean_path,
      registration_completed = true,
      updated_at = now()
  where id = v_user_id;

end;
$$;

revoke execute on function public.complete_customer_registration(text) from public, anon;
grant execute on function public.complete_customer_registration(text) to authenticated, service_role;

-- 5. Trigger defense against direct client bypass of registration_completed (INSERT & UPDATE)
create or replace function public.guard_registration_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 0. Permit postgres/supabase_admin or server-side service role
  if session_user in ('postgres', 'supabase_admin') and auth.uid() is null then
    return new;
  end if;

  -- 1. If an admin is performing the action, permit it
  if public.is_admin() then
    return new;
  end if;

  -- 2. On INSERT:
  -- Any new customer profile must begin with registration_completed = false.
  -- This prevents INSERT bypass even if the client passes registration_completed = true.
  if tg_op = 'INSERT' then
    if new.role = 'customer' then
      new.registration_completed := false;
    end if;
    return new;
  end if;

  -- 3. On UPDATE:
  -- If registration_completed is transitioning from false to true:
  if tg_op = 'UPDATE' then
    if old.registration_completed is false and new.registration_completed is true then
      -- Must have been invoked via complete_customer_registration() which sets this config setting
      if current_setting('donekaro.completing_registration', true) is distinct from 'true' then
        raise exception 'Unauthorized: Direct modification of registration_completed is prohibited. Call complete_customer_registration() with a verified address document.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_registration_completion on public.profiles;
create trigger trg_guard_registration_completion
before insert or update on public.profiles
for each row
execute function public.guard_registration_completion();
