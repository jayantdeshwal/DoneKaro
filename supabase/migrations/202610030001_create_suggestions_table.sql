-- Migration: Create suggestions table and RLS policies for Platform Suggestions & Feedback
-- Follows existing platform conventions, public.is_admin() helper, and strict RLS isolation.

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('app_experience', 'new_feature', 'service_coverage', 'other')),
  message text not null check (char_length(trim(message)) >= 10 and char_length(message) <= 2000),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'dismissed')),
  resolution_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

-- Query performance indexes
create index if not exists suggestions_submitted_by_idx on public.suggestions(submitted_by, created_at desc);
create index if not exists suggestions_status_idx on public.suggestions(status, created_at desc);

-- Enable Row Level Security
alter table public.suggestions enable row level security;

-- Policies:
-- 1. Authenticated users can insert their own suggestions
create policy "Authenticated users can create suggestions"
on public.suggestions for insert
with check (
  auth.uid() is not null
  and submitted_by = auth.uid()
);

-- 2. Submitters can read their own suggestions; platform administrators can read all suggestions
create policy "Suggestion submitters and admins can view suggestions"
on public.suggestions for select
using (
  submitted_by = auth.uid()
  or public.is_admin()
);

-- 3. Only platform administrators can update suggestions (status, resolution note, resolved timestamp)
create policy "Admins can update suggestions"
on public.suggestions for update
using (public.is_admin())
with check (public.is_admin());

-- Trigger to automatically update updated_at timestamp on suggestion modifications
create or replace function public.set_suggestion_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  if new.status in ('resolved', 'dismissed') and old.status not in ('resolved', 'dismissed') and new.resolved_at is null then
    new.resolved_at := timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_suggestion_updated_at on public.suggestions;
create trigger trg_set_suggestion_updated_at
before update on public.suggestions
for each row execute function public.set_suggestion_updated_at();
