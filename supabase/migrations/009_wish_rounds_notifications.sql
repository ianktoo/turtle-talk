-- Migration: 009_wish_rounds_notifications
-- Wish pivot: growth cycle (3 missions), wish rounds (5 AI options, child picks 3, parent honors 1), parent notifications.
-- Run after 008. Apply with: supabase db push

-- ============================================================
-- child_growth_cycle (one row per child; missions in current cycle)
-- ============================================================
create table if not exists public.child_growth_cycle (
  child_id                   uuid primary key references public.children(id) on delete cascade,
  missions_completed_in_cycle int not null default 0,
  last_growth_at             timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

alter table public.child_growth_cycle enable row level security;

-- Parents can select for their linked children; insert/update via API (service role or server)
drop policy if exists "child_growth_cycle_parent_select" on public.child_growth_cycle;
create policy "child_growth_cycle_parent_select" on public.child_growth_cycle
  for select using (
    exists (
      select 1 from public.parent_child pc
      where pc.child_id = child_growth_cycle.child_id and pc.parent_id = auth.uid()
    )
  );

drop trigger if exists child_growth_cycle_updated_at on public.child_growth_cycle;
create trigger child_growth_cycle_updated_at
  before update on public.child_growth_cycle
  for each row execute function public.set_updated_at();

-- ============================================================
-- child_wish_round (one round = 5 options, child picks 3, parent honors 1)
-- ============================================================
create table if not exists public.child_wish_round (
  id                        uuid primary key default gen_random_uuid(),
  child_id                  uuid not null references public.children(id) on delete cascade,
  status                    text not null default 'generating'
    check (status in ('generating', 'child_picking', 'child_picked', 'parent_choosing', 'parent_honored')),
  parent_honored_option_id  uuid,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists child_wish_round_child_id_idx on public.child_wish_round(child_id);
create index if not exists child_wish_round_status_idx on public.child_wish_round(child_id, status);

alter table public.child_wish_round enable row level security;

-- Parents can select rounds for their linked children
drop policy if exists "child_wish_round_parent_select" on public.child_wish_round;
create policy "child_wish_round_parent_select" on public.child_wish_round
  for select using (
    exists (
      select 1 from public.parent_child pc
      where pc.child_id = child_wish_round.child_id and pc.parent_id = auth.uid()
    )
  );

-- Insert/update is done via API with service role (child session or server)

drop trigger if exists child_wish_round_updated_at on public.child_wish_round;
create trigger child_wish_round_updated_at
  before update on public.child_wish_round
  for each row execute function public.set_updated_at();

-- ============================================================
-- child_wish_option (5 per round; AI-generated labels)
-- ============================================================
create table if not exists public.child_wish_option (
  id               uuid primary key default gen_random_uuid(),
  round_id         uuid not null references public.child_wish_round(id) on delete cascade,
  label            text not null,
  theme_slug       text not null,
  sort_order       int not null default 0,
  selected_by_child boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists child_wish_option_round_id_idx on public.child_wish_option(round_id);

alter table public.child_wish_option enable row level security;

-- Parents can select options for rounds of their linked children
drop policy if exists "child_wish_option_parent_select" on public.child_wish_option;
create policy "child_wish_option_parent_select" on public.child_wish_option
  for select using (
    exists (
      select 1 from public.child_wish_round r
      join public.parent_child pc on pc.child_id = r.child_id and pc.parent_id = auth.uid()
      where r.id = child_wish_option.round_id
    )
  );

-- Insert/update via API (service role for child session, or server)

-- FK from round to honored option (add after options exist)
alter table public.child_wish_round
  drop constraint if exists child_wish_round_parent_honored_option_id_fkey;
alter table public.child_wish_round
  add constraint child_wish_round_parent_honored_option_id_fkey
  foreign key (parent_honored_option_id) references public.child_wish_option(id) on delete set null;

-- ============================================================
-- parent_notification (in-dashboard alerts; no SMS)
-- ============================================================
create table if not exists public.parent_notification (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists parent_notification_parent_id_idx on public.parent_notification(parent_id);
create index if not exists parent_notification_read_at_idx on public.parent_notification(parent_id, read_at);

alter table public.parent_notification enable row level security;

drop policy if exists "parent_notification_select_own" on public.parent_notification;
create policy "parent_notification_select_own" on public.parent_notification
  for select using (auth.uid() = parent_id);

drop policy if exists "parent_notification_update_own" on public.parent_notification;
create policy "parent_notification_update_own" on public.parent_notification
  for update using (auth.uid() = parent_id);

-- Insert is done via API (server) when growth moment or child picks wishes
