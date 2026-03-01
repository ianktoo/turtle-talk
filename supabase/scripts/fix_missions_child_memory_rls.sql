-- Fix 401 on missions / child_memory: ensure permissive RLS for anon access.
-- Run in Supabase Dashboard → SQL Editor if your app gets 401 on these tables.
-- (Migration 001 should have created these; run this if policies are missing or were changed.)

-- missions: allow all for anon (no auth required for child missions in this app)
alter table if exists public.missions enable row level security;
drop policy if exists "missions_all" on public.missions;
create policy "missions_all" on public.missions
  for all using (true) with check (true);

-- child_memory: allow all for anon
alter table if exists public.child_memory enable row level security;
drop policy if exists "child_memory_all" on public.child_memory;
create policy "child_memory_all" on public.child_memory
  for all using (true) with check (true);
