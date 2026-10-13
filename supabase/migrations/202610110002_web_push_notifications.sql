-- ============================================================================
-- Migration: 202610110002_web_push_notifications.sql
-- Description: Web Push Subscriptions, Atomic Outbox Queue, and Account Deletion
-- Security: Strict RLS on subscriptions, outbox isolation, caller-verified RPCs,
--           FOR UPDATE SKIP LOCKED concurrency protection, and Super-Admin guard.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PUSH SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  locale text not null default 'en',
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id) where is_active = true;

alter table public.push_subscriptions enable row level security;

-- RLS Policies: Authenticated users can only manage their own subscriptions
drop policy if exists "Users can view own push subscriptions" on public.push_subscriptions;
create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. TRANSACTIONAL PUSH OUTBOX TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.notification_push_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'processing', 'sent', 'failed', 'no_subscription'
  attempts int not null default 0,
  max_attempts int not null default 3,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

create index if not exists push_outbox_queue_idx
  on public.notification_push_outbox(status, attempts, processed_at, created_at);

alter table public.notification_push_outbox enable row level security;

-- Only service role and verified administrators can view the push outbox
drop policy if exists "Admins and service role can read outbox" on public.notification_push_outbox;
create policy "Admins and service role can read outbox"
  on public.notification_push_outbox for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'admin', 'sub_admin')
    )
  );

-- ----------------------------------------------------------------------------
-- 3. SUBSCRIPTION RPC FUNCTIONS (IDEMPOTENT & SAFE)
-- ----------------------------------------------------------------------------

create or replace function public.save_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_locale text default 'en',
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_normalized_locale text;
  v_result public.push_subscriptions%rowtype;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Unauthorized: Caller session required';
  end if;

  if p_endpoint is null or length(trim(p_endpoint)) = 0 then
    raise exception 'Invalid push endpoint';
  end if;

  if p_p256dh is null or length(trim(p_p256dh)) = 0 or p_auth is null or length(trim(p_auth)) = 0 then
    raise exception 'Missing subscription keys';
  end if;

  v_normalized_locale := case when lower(trim(coalesce(p_locale, 'en'))) in ('hi', 'hindi') then 'hi' else 'en' end;

  insert into public.push_subscriptions (
    user_id,
    endpoint,
    p256dh,
    auth,
    locale,
    user_agent,
    is_active,
    updated_at
  ) values (
    v_caller_id,
    trim(p_endpoint),
    trim(p_p256dh),
    trim(p_auth),
    v_normalized_locale,
    p_user_agent,
    true,
    timezone('utc', now())
  )
  on conflict (endpoint) do update
  set
    user_id = v_caller_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    locale = coalesce(excluded.locale, push_subscriptions.locale),
    user_agent = coalesce(excluded.user_agent, push_subscriptions.user_agent),
    is_active = true,
    updated_at = timezone('utc', now())
  returning * into v_result;

  return jsonb_build_object(
    'success', true,
    'subscription_id', v_result.id,
    'is_active', v_result.is_active,
    'locale', v_result.locale
  );
end;
$$;

revoke execute on function public.save_push_subscription(text, text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text, text) to authenticated, service_role;

create or replace function public.remove_push_subscription(p_endpoint text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Unauthorized';
  end if;

  delete from public.push_subscriptions
  where user_id = v_caller_id
    and endpoint = trim(p_endpoint);

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.remove_push_subscription(text) from public, anon;
grant execute on function public.remove_push_subscription(text) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. PUSH OUTBOX TRIGGER (ELIGIBLE NOTIFICATIONS ONLY)
-- ----------------------------------------------------------------------------

create or replace function public.enqueue_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_active_subs boolean;
  v_initial_status text;
begin
  -- Restrict push delivery to eligible notification events only
  if new.notification_type not in (
    'booking_created',
    'booking_accepted',
    'booking_in_progress',
    'booking_completed',
    'booking_rejected',
    'booking_cancelled',
    'quote_received',
    'quote_accepted',
    'review_received',
    'worker_registration_submitted',
    'profile_approved',
    'profile_rejected'
  ) then
    return new;
  end if;

  -- Check if recipient has any active subscriptions
  select exists (
    select 1 from public.push_subscriptions
    where user_id = new.user_id and is_active = true
  ) into v_has_active_subs;

  if v_has_active_subs then
    v_initial_status := 'pending';
  else
    v_initial_status := 'no_subscription';
  end if;

  insert into public.notification_push_outbox (
    notification_id,
    user_id,
    status
  ) values (
    new.id,
    new.user_id,
    v_initial_status
  )
  on conflict (notification_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_enqueue_push_notification on public.notifications;
create trigger trg_enqueue_push_notification
  after insert on public.notifications
  for each row
  execute function public.enqueue_push_notification();

-- ----------------------------------------------------------------------------
-- 5. ATOMIC OUTBOX QUEUE CLAIMING & COMPLETION (CONCURRENCY DEFENSE)
-- ----------------------------------------------------------------------------

create or replace function public.claim_push_outbox_batch(p_batch_size int default 20)
returns table (
  outbox_id uuid,
  notification_id uuid,
  user_id uuid,
  attempts int,
  notification_type text,
  title text,
  body text,
  booking_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimed as (
    select o.id
    from public.notification_push_outbox o
    where (
      -- Pending items within attempt limit
      (o.status = 'pending' and o.attempts < o.max_attempts)
      or
      -- Failed items ready for retry with exponential backoff (30s * 2^attempts)
      (
        o.status = 'failed'
        and o.attempts < o.max_attempts
        and o.processed_at is not null
        and o.processed_at < (timezone('utc', now()) - (interval '30 seconds' * power(2, o.attempts)))
      )
      or
      -- Reclaim zombie locks stuck in 'processing' for more than 5 minutes
      (
        o.status = 'processing'
        and o.processed_at is not null
        and o.processed_at < (timezone('utc', now()) - interval '5 minutes')
      )
    )
    order by o.created_at asc
    limit least(greatest(coalesce(p_batch_size, 20), 1), 50)
    for update skip locked
  )
  update public.notification_push_outbox o
  set
    status = 'processing',
    processed_at = timezone('utc', now())
  from claimed c
  join public.notifications n on n.id = o.notification_id
  where o.id = c.id
  returning
    o.id as outbox_id,
    o.notification_id,
    o.user_id,
    o.attempts,
    n.notification_type,
    n.title,
    n.body,
    n.booking_id,
    o.created_at;
end;
$$;

revoke execute on function public.claim_push_outbox_batch(int) from public, anon;
grant execute on function public.claim_push_outbox_batch(int) to service_role;

create or replace function public.complete_push_outbox_item(
  p_outbox_id uuid,
  p_status text,
  p_last_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('sent', 'failed', 'no_subscription') then
    raise exception 'Invalid outbox status: %', p_status;
  end if;

  update public.notification_push_outbox
  set
    status = p_status,
    attempts = attempts + 1,
    last_error = p_last_error,
    processed_at = timezone('utc', now())
  where id = p_outbox_id;

  return found;
end;
$$;

revoke execute on function public.complete_push_outbox_item(uuid, text, text) from public, anon;
grant execute on function public.complete_push_outbox_item(uuid, text, text) to service_role;

-- ----------------------------------------------------------------------------
-- 6. ACCOUNT DELETION GOVERNANCE
-- ----------------------------------------------------------------------------
-- Self-service account deletion for customers and workers is deliberately disabled
-- to protect financial ledger immutability and retain administrative compatibility.
-- Administrative account deletion remains available via public.admin_delete_profile_permanently().

