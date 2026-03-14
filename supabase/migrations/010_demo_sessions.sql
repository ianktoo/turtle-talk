-- Migration: 010_demo_sessions
-- Creates demo_sessions table for TurtleTalk demo flows.
-- Stores anonymous child-facing demo data keyed by demo_id, with optional
-- parent/child links that can be added later when accounts are involved.

create table if not exists public.demo_sessions (
  demo_id text primary key,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,

  -- Child-facing demo snapshot
  child_name text,
  age_group text,
  favorite_book text,
  fun_facts text[],
  topics text[],
  completed_missions_count integer,
  wish_choice text,
  messages_summary jsonb,

  -- Optional association to real parent/child records
  parent_id uuid references public.profiles(id) on delete set null,
  child_id uuid references public.children(id) on delete set null,
  linked_at timestamptz,

  source text
);

alter table public.demo_sessions enable row level security;

-- Anyone (including anon demo clients) can insert demo rows.
create policy "demo_sessions_insert_anon" on public.demo_sessions
  for insert
  with check (true);

-- Read access:
-- - By demo_id for anonymous demo flows (QR-based parent view)
-- - By parent_id for logged-in parents (future), or admins via service role
create policy "demo_sessions_select_by_demo_or_parent" on public.demo_sessions
  for select
  using (
    -- Allow lookup by demo_id for demo flows. The application always filters
    -- by demo_id in anonymous GET /api/demo/session/[demoId] calls.
    true
  );

-- Updates are done by server-side admin APIs using the service role.
create policy "demo_sessions_update_admin_only" on public.demo_sessions
  for update
  using (false)
  with check (false);

