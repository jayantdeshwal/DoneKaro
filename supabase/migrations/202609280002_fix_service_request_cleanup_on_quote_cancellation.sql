-- Fix service request cleanup and active slot release on quote cancellation, rejection, or expiration.
-- 1. When a quote request transitions to a non-accepted terminal state ('cancelled', 'rejected', 'expired')
--    and no other active quote requests ('pending', 'quoted') remain for that service request,
--    the parent service request must transition to 'cancelled'.
-- 2. Transitioning service_requests.status to 'cancelled' automatically fires the existing
--    trg_release_service_request_active_slot trigger, which releases the customer_service_active_slots
--    claim atomically and prevents customer category lockouts (Finding P1).

-- 1. Trigger function: cleanup parent service_request when all its quote requests become terminal
create or replace function public.cleanup_service_request_on_quote_terminal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act when moving from an active state ('pending', 'quoted')
  -- to a non-accepted terminal state ('cancelled', 'rejected', 'expired')
  if old.status in ('pending', 'quoted') and new.status in ('cancelled', 'rejected', 'expired') then
    -- Check if any other active quote request exists for this service request
    if not exists (
      select 1 from public.booking_quote_requests
      where service_request_id = new.service_request_id
        and id <> new.id
        and status in ('pending', 'quoted')
    ) then
      update public.service_requests
      set status = 'cancelled', updated_at = timezone('utc', now())
      where id = new.service_request_id
        and status = 'open';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.cleanup_service_request_on_quote_terminal() from public, anon, authenticated;

drop trigger if exists trg_cleanup_service_request_on_quote_terminal on public.booking_quote_requests;
create trigger trg_cleanup_service_request_on_quote_terminal
after update of status on public.booking_quote_requests
for each row execute function public.cleanup_service_request_on_quote_terminal();

-- 2. Update cancel_booking_quote_request to ensure search_path, permissions, and atomic cancellation
create or replace function public.cancel_booking_quote_request(
  target_quote_request_id uuid,
  target_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_service_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to cancel a quote request';
  end if;

  select status, service_request_id into v_status, v_service_request_id
  from public.booking_quote_requests
  where id = target_quote_request_id and customer_id = auth.uid()
  for update;

  if v_status is null then
    raise exception 'Quote request was not found or can no longer be cancelled';
  end if;

  if v_status = 'pending' and exists (
    select 1 from public.booking_quote_requests
    where id = target_quote_request_id
      and response_deadline_at <= timezone('utc', now())
  ) then
    update public.booking_quote_requests
    set status = 'expired', updated_at = timezone('utc', now())
    where id = target_quote_request_id;
    return;
  end if;

  if v_status not in ('pending', 'quoted') then
    raise exception 'Quote request was not found or can no longer be cancelled';
  end if;

  update public.booking_quotes
  set status = 'cancelled', updated_at = timezone('utc', now())
  where quote_request_id = target_quote_request_id and status = 'submitted';

  update public.booking_quote_requests
  set status = 'cancelled',
      cancelled_at = timezone('utc', now()),
      cancellation_reason = nullif(trim(target_reason), ''),
      updated_at = timezone('utc', now())
  where id = target_quote_request_id;
end;
$$;

revoke execute on function public.cancel_booking_quote_request(uuid, text) from public, anon;
grant execute on function public.cancel_booking_quote_request(uuid, text) to authenticated;
