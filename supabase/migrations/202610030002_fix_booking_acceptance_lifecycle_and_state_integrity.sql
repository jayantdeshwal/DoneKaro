-- Phase 11: Fix booking acceptance lifecycle and state integrity.
-- 1. Update guard_booking_inserts() to allow initial status 'accepted' in addition to 'pending'.
--    When a customer accepts a provider's quote, the mutual agreement is already established,
--    so the created booking is directly in 'accepted' status (no redundant second acceptance).
-- 2. Update create_booking() to insert new bookings with status 'accepted'.
-- 3. Update handle_booking_notification() on INSERT to send confirmation notification to the customer
--    when a booking is created in 'accepted' state, and avoid duplicate "new booking request" to the worker
--    who already received the quote acceptance notification.
-- 4. Heal any existing pending bookings that already have an accepted quote.

-- 1. Update guard_booking_inserts() to allow status 'accepted'
create or replace function public.guard_booking_inserts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bypass for automated maintenance or migration executions in superuser session
  if session_user in ('postgres', 'supabase_admin') and auth.uid() is null then
    return new;
  end if;

  -- JUGNU-SEC-09: Enforce Self-Booking Prevention
  if new.customer_id = new.worker_id then
    raise exception 'Action prohibited: Users cannot book their own services (self-booking).';
  end if;

  -- For non-administrators, enforce customer identity and initial status
  if not public.is_admin() then
    if auth.uid() is null then
      raise exception 'Unauthorized: Authentication required to create bookings.';
    end if;

    if new.customer_id <> auth.uid() then
      raise exception 'Action prohibited: You cannot create bookings on behalf of another user.';
    end if;

    -- Enforce initial status MUST be pending or accepted
    if new.status not in ('pending', 'accepted') then
      raise exception 'Action prohibited: New bookings must be created with status pending or accepted.';
    end if;
  end if;

  return new;
end;
$$;

-- 2. Update create_booking() to insert with status 'accepted'
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
    customer_id, worker_id, category_id, service_area_id, scheduled_at, address, notes, status
  ) values (
    auth.uid(), target_worker_id, target_category_id, target_area_id,
    target_scheduled_at, trim(target_address), nullif(trim(target_notes), ''), 'accepted'
  ) returning id into new_booking_id;

  return new_booking_id;
end;
$$;

-- Preserve internal-only execution security (only callable by accept_booking_quote)
revoke execute on function public.create_booking(uuid, text, text, timestamptz, text, text)
  from public, anon, authenticated;

-- 3. Update handle_booking_notification() for proper notification flow
create or replace function public.handle_booking_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_name text;
  v_worker_name text;
  v_category_name text;
begin
  -- Retrieve customer name
  select full_name into v_customer_name from public.profiles where id = new.customer_id;
  v_customer_name := coalesce(nullif(trim(v_customer_name), ''), 'Customer');

  -- Retrieve worker name
  select full_name into v_worker_name from public.profiles where id = new.worker_id;
  v_worker_name := coalesce(nullif(trim(v_worker_name), ''), 'Artisan');

  -- Retrieve category name
  select name_en into v_category_name from public.categories where id = new.category_id;
  v_category_name := coalesce(v_category_name, new.category_id);

  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      -- When a legacy pending booking is created, notify the assigned worker
      insert into public.notifications (
        user_id,
        booking_id,
        notification_type,
        title,
        body
      ) values (
        new.worker_id,
        new.id,
        'booking_created',
        'New booking request',
        v_customer_name || ' sent you a new booking request for ' || v_category_name || '.'
      );
    elsif new.status = 'accepted' then
      -- Quote acceptance already notifies the worker ('quote_accepted').
      -- Notify customer that their booking is confirmed with the assigned artisan.
      insert into public.notifications (
        user_id,
        booking_id,
        notification_type,
        title,
        body
      ) values (
        new.customer_id,
        new.id,
        'booking_accepted',
        'Booking confirmed',
        'Your booking for ' || v_category_name || ' with ' || v_worker_name || ' is confirmed.'
      );
    end if;

  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'accepted' and old.status = 'pending' then
      -- Worker accepted legacy pending booking -> notify customer
      insert into public.notifications (
        user_id,
        booking_id,
        notification_type,
        title,
        body
      ) values (
        new.customer_id,
        new.id,
        'booking_accepted',
        'Booking accepted',
        v_worker_name || ' accepted your ' || v_category_name || ' booking request.'
      );

    elsif new.status = 'in_progress' then
      -- Worker started service -> notify customer
      insert into public.notifications (
        user_id,
        booking_id,
        notification_type,
        title,
        body
      ) values (
        new.customer_id,
        new.id,
        'booking_in_progress',
        'Service in progress',
        v_worker_name || ' has started your ' || v_category_name || ' service.'
      );

    elsif new.status = 'completed' then
      -- Service finished -> notify customer to review
      insert into public.notifications (
        user_id,
        booking_id,
        notification_type,
        title,
        body
      ) values (
        new.customer_id,
        new.id,
        'booking_completed',
        'Booking completed',
        v_worker_name || ' has completed your ' || v_category_name || ' service. Please leave a review.'
      );

    elsif new.status = 'rejected' then
      -- Worker rejected -> notify customer
      insert into public.notifications (
        user_id,
        booking_id,
        notification_type,
        title,
        body
      ) values (
        new.customer_id,
        new.id,
        'booking_rejected',
        'Booking declined',
        v_worker_name || ' was unable to accept your ' || v_category_name || ' booking request.'
      );

    elsif new.status = 'cancelled' then
      -- Customer cancelled -> notify worker
      insert into public.notifications (
        user_id,
        booking_id,
        notification_type,
        title,
        body
      ) values (
        new.worker_id,
        new.id,
        'booking_cancelled',
        'Booking cancelled',
        v_customer_name || ' cancelled the ' || v_category_name || ' booking.'
      );
    end if;
  end if;

  return new;
end;
$$;

-- 4. Heal any existing pending bookings that already have an accepted quote
update public.bookings b
set status = 'accepted', updated_at = timezone('utc', now())
where b.status = 'pending'
  and exists (
    select 1 from public.booking_quotes q
    where q.booking_id = b.id and q.status = 'accepted'
  );
