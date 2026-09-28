-- Fix cross-pincode quote acceptance and harden accepted-quote integrity.
-- 1. Align create_booking() worker eligibility with create_booking_quote_request() (Step 1)
--    by removing the hard worker_service_areas exact-pincode restriction while preserving
--    worker approval, availability, category qualification, and city-wide service area validation.
-- 2. Add partial unique index on booking_quotes(booking_id) for accepted quotes.

-- 1. Align create_booking worker eligibility with Muzaffarnagar city coverage
create or replace function public.create_booking(
  target_worker_id uuid,
  target_category_id text,
  target_pincode text,
  target_scheduled_at timestamptz,
  target_address text,
  target_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_booking_id uuid;
  target_area_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a booking';
  end if;

  if exists (
    select 1 from public.customer_service_active_slots
    where customer_id = auth.uid()
      and category_id = target_category_id
      and source = 'booking'
  ) then
    perform public.raise_active_service_request_exists();
  end if;

  select id into target_area_id
  from public.service_areas
  where pincode = target_pincode;
  if target_area_id is null then
    raise exception 'This service area is not supported yet';
  end if;

  -- Worker eligibility: verified approval, availability, and category match.
  -- Muzaffarnagar city coverage applies generally; exact-pincode matching is no longer a hard rejection.
  if not exists (
    select 1
    from public.worker_profiles wp
    join public.worker_categories wc on wc.worker_id = wp.id and wc.category_id = target_category_id
    where wp.id = target_worker_id
      and wp.approval_status = 'approved'
      and wp.is_available = true
  ) then
    raise exception 'This worker is not available for the selected service';
  end if;

  insert into public.bookings (
    customer_id, worker_id, category_id, service_area_id, scheduled_at, address, notes
  ) values (
    auth.uid(), target_worker_id, target_category_id, target_area_id,
    target_scheduled_at, trim(target_address), nullif(trim(target_notes), '')
  ) returning id into new_booking_id;

  return new_booking_id;
end;
$$;

-- Preserve internal-only execution security (only callable by accept_booking_quote)
revoke execute on function public.create_booking(uuid, text, text, timestamptz, text, text)
  from public, anon, authenticated;

-- 2. Enforce database-level uniqueness invariant: at most one accepted quote per booking
create unique index if not exists booking_quotes_one_accepted_per_booking
  on public.booking_quotes(booking_id)
  where booking_id is not null and status = 'accepted';
