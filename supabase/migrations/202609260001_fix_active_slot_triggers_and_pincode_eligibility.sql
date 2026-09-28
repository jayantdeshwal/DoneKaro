-- Fix active-slot claim triggers and provider eligibility matching.
-- 1. Change trg_claim_service_request_active_slot from BEFORE to AFTER INSERT OR UPDATE.
-- 2. Change trg_claim_booking_active_slot from BEFORE to AFTER INSERT OR UPDATE.
-- 3. In create_booking_quote_request, remove hard exact-pincode join so Muzaffarnagar workers can serve customers across supported city pincodes.
-- 4. Add cancel_service_request RPC to safely clean up any orphaned service requests.

-- 1. Fix service_requests claim trigger timing
drop trigger if exists trg_claim_service_request_active_slot on public.service_requests;
create trigger trg_claim_service_request_active_slot
after insert or update of customer_id, category_id, status on public.service_requests
for each row execute function public.claim_service_request_active_slot();

-- 2. Fix bookings claim trigger timing
drop trigger if exists trg_claim_booking_active_slot on public.bookings;
create trigger trg_claim_booking_active_slot
after insert or update of customer_id, category_id, status on public.bookings
for each row execute function public.claim_booking_active_slot();

-- 3. Provider eligibility: allow approved active workers to serve supported city areas
create or replace function public.create_booking_quote_request(
  target_service_request_id uuid,
  target_worker_id uuid,
  target_response_deadline_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
  v_request_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in to request a quote'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'customer') then
    raise exception 'Only customers can request a quote';
  end if;
  if target_response_deadline_at is null or target_response_deadline_at <= timezone('utc', now()) then
    raise exception 'Response deadline must be in the future';
  end if;

  select * into v_request
  from public.service_requests
  where id = target_service_request_id and customer_id = auth.uid()
  for update;
  if v_request.id is null or v_request.status <> 'open' then
    raise exception 'Service request was not found or is no longer open';
  end if;

  if exists (
    select 1 from public.customer_service_active_slots
    where customer_id = v_request.customer_id
      and category_id = v_request.category_id
      and source = 'booking'
  ) then
    perform public.raise_active_service_request_exists();
  end if;

  update public.booking_quote_requests as bqr
  set status = 'expired', updated_at = timezone('utc', now())
  where service_request_id = target_service_request_id
    and exists (
      select 1 from public.service_requests sr
      where sr.id = bqr.service_request_id and sr.customer_id = auth.uid()
    )
    and status = 'pending'
    and response_deadline_at <= timezone('utc', now());

  -- Worker eligibility: verified approval, availability, and category match.
  -- Muzaffarnagar city coverage applies generally; exact-pincode matching is no longer a hard rejection.
  if not exists (
    select 1
    from public.worker_profiles wp
    join public.worker_categories wc on wc.worker_id = wp.id and wc.category_id = v_request.category_id
    where wp.id = target_worker_id
      and wp.approval_status = 'approved'
      and wp.is_available = true
  ) then
    raise exception 'Selected provider is not eligible for this service request';
  end if;

  insert into public.booking_quote_requests (service_request_id, customer_id, worker_id, response_deadline_at)
  values (v_request.id, auth.uid(), target_worker_id, target_response_deadline_at)
  returning id into v_request_id;
  return v_request_id;
exception
  when unique_violation then
    raise exception 'An active provider quote request already exists for this service request';
end;
$$;

revoke execute on function public.create_booking_quote_request(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.create_booking_quote_request(uuid, uuid, timestamptz) to authenticated;

-- 4. Customer service request cancellation to release active slot
create or replace function public.cancel_service_request(target_service_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'You must be signed in'; end if;
  select * into v_request
  from public.service_requests
  where id = target_service_request_id and customer_id = auth.uid()
  for update;
  if v_request.id is null then raise exception 'Service request not found'; end if;
  if v_request.status <> 'open' then raise exception 'Only open service requests can be cancelled'; end if;

  update public.service_requests
  set status = 'cancelled', updated_at = timezone('utc', now())
  where id = target_service_request_id;
end;
$$;

revoke execute on function public.cancel_service_request(uuid) from public, anon;
grant execute on function public.cancel_service_request(uuid) to authenticated;
