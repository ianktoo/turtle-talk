-- Migration: 001_initial
-- Creates the missions and child_memory tables.
-- RLS is permissive (using (true)) — no auth required in first phase.
-- Run with: supabase db push  OR  paste into the Supabase SQL editor.

-- ============================================================
-- missions
-- ============================================================
create table if not exists missions (
  id           uuid primary key default gen_random_uuid(),
  child_id     text not null,
  title        text not null,
  description  text not null,
  theme        text not null,
  difficulty   text not null check (difficulty in ('easy', 'medium', 'stretch')),
  status       text not null default 'active' check (status in ('active', 'completed')),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

alter table missions enable row level security;

create policy "missions_all" on missions
  for all using (true) with check (true);

-- ============================================================
-- child_memory
-- ============================================================
create table if not exists child_memory (
  child_id    text primary key,
  child_name  text,
  messages    jsonb not null default '[]'::jsonb,
  topics      jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table child_memory enable row level security;

create policy "child_memory_all" on child_memory
  for all using (true) with check (true);

-- keep updated_at current on every write
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists child_memory_updated_at on child_memory;
create trigger child_memory_updated_at
  before update on child_memory
  for each row execute function set_updated_at();
