-- Migration: 004_weekly_reports_dinner_questions
-- Creates weekly_reports and dinner_questions for parent-facing content.
-- Run after 003_profiles_children_waiting_list.
-- Run with: supabase db push  OR  paste into the Supabase SQL editor.

-- ============================================================
-- weekly_reports (one row per child per week; agent/cron writes payload)
-- ============================================================
create table if not exists public.weekly_reports (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children(id) on delete cascade,
  week_start date not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (child_id, week_start)
);

alter table public.weekly_reports enable row level security;

-- Parents see reports only for their linked children; admins see all
create policy "weekly_reports_select_via_parent_or_admin" on public.weekly_reports
  for select using (
    exists (select 1 from public.parent_child pc where pc.child_id = weekly_reports.child_id and pc.parent_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "weekly_reports_insert_via_parent_or_admin" on public.weekly_reports
  for insert with check (
    exists (select 1 from public.parent_child pc where pc.child_id = weekly_reports.child_id and pc.parent_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "weekly_reports_update_via_parent_or_admin" on public.weekly_reports
  for update using (
    exists (select 1 from public.parent_child pc where pc.child_id = weekly_reports.child_id and pc.parent_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- dinner_questions (pending/completed; ~5 pending per child)
-- ============================================================
create table if not exists public.dinner_questions (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.profiles(id) on delete cascade,
  child_id     uuid not null references public.children(id) on delete cascade,
  question     text not null,
  theme        text not null,
  status       text not null default 'pending' check (status in ('pending', 'completed')),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.dinner_questions enable row level security;

create policy "dinner_questions_select_own_or_admin" on public.dinner_questions
  for select using (
    auth.uid() = parent_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "dinner_questions_insert_own" on public.dinner_questions
  for insert with check (auth.uid() = parent_id);

create policy "dinner_questions_update_own" on public.dinner_questions
  for update using (auth.uid() = parent_id);

create index if not exists dinner_questions_child_status
  on public.dinner_questions (child_id, status);

create index if not exists weekly_reports_child_week
  on public.weekly_reports (child_id, week_start desc);
