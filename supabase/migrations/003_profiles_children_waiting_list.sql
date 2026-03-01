-- Migration: 003_profiles_children_waiting_list
-- Creates profiles (extends auth.users), children, parent_child, waiting_list,
-- feature_flags, and support_requests. Enables RLS and policies for auth-based access.
-- Run after 001_initial and 002_indexes. Requires Supabase Auth (auth.users).
-- Run with: supabase db push  OR  paste into the Supabase SQL editor.

-- ============================================================
-- profiles (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'parent' check (role in ('parent', 'child', 'admin')),
  display_name  text,
  access_status text not null default 'inactive' check (access_status in ('inactive', 'trial', 'customer')),
  suspended_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Trigger: keep updated_at current
create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- ============================================================
-- children (parent-managed; login_key + emoji + first_name for child login)
-- ============================================================
create table if not exists public.children (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  emoji      text not null,
  login_key  text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint login_key_format check (char_length(login_key) = 6 and login_key ~ '^[A-Za-z0-9]+$')
);

-- ============================================================
-- parent_child (links parents to children) — must exist before children RLS policies
-- ============================================================
create table if not exists public.parent_child (
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_id, child_id)
);

alter table public.children enable row level security;

-- Parents see only children linked via parent_child; admins see all
create policy "children_via_parent_or_admin" on public.children
  for select using (
    exists (select 1 from public.parent_child pc where pc.child_id = children.id and pc.parent_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "children_insert_via_parent_or_admin" on public.children
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'parent' or p.role = 'admin'))
  );

create policy "children_update_via_parent_or_admin" on public.children
  for update using (
    exists (select 1 from public.parent_child pc where pc.child_id = children.id and pc.parent_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter table public.parent_child enable row level security;

create policy "parent_child_select_own_or_admin" on public.parent_child
  for select using (
    auth.uid() = parent_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "parent_child_insert_own_or_admin" on public.parent_child
  for insert with check (
    auth.uid() = parent_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "parent_child_delete_own_or_admin" on public.parent_child
  for delete using (
    auth.uid() = parent_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- waiting_list (emails waiting for approval; admins invite/approve/reject)
-- ============================================================
create table if not exists public.waiting_list (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  status      text not null default 'pending' check (status in ('pending', 'invited', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  invited_at  timestamptz,
  invited_by  uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null
);

alter table public.waiting_list enable row level security;

-- Anyone can insert (public join form); only service role or admin backend can update
create policy "waiting_list_insert_anon" on public.waiting_list
  for insert with check (true);

create policy "waiting_list_select_admin" on public.waiting_list
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "waiting_list_update_admin" on public.waiting_list
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- feature_flags (admin toggles; app reads)
-- ============================================================
create table if not exists public.feature_flags (
  key       text primary key,
  enabled   boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;

create policy "feature_flags_select_all" on public.feature_flags
  for select using (true);

create policy "feature_flags_update_admin" on public.feature_flags
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "feature_flags_insert_admin" on public.feature_flags
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- support_requests
-- ============================================================
create table if not exists public.support_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  subject    text not null,
  body       text not null,
  status     text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_requests enable row level security;

create policy "support_requests_select_own" on public.support_requests
  for select using (auth.uid() = user_id);

create policy "support_requests_insert_own" on public.support_requests
  for insert with check (auth.uid() = user_id);

create policy "support_requests_admin_all" on public.support_requests
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create trigger support_requests_updated_at
  before update on public.support_requests
  for each row execute function public.set_updated_at();
