-- Migration: 006_fix_profiles_rls_recursion
-- Fixes "infinite recursion detected in policy for relation profiles" (42P17).
-- Cause: policies on profiles and other tables used "exists (select 1 from public.profiles ...)"
-- which re-triggers RLS on profiles. Fix: a SECURITY DEFINER helper that reads profiles
-- without re-entering RLS, and use it in all admin-check policies.
-- Run after 003. Apply with: supabase db push  OR  paste into Supabase SQL editor.

-- Helper: true if the current session user has role 'admin' in profiles.
-- SECURITY DEFINER so the inner SELECT runs as the function owner and avoids RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Drop and recreate profiles policy that caused recursion
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

-- children
drop policy if exists "children_via_parent_or_admin" on public.children;
create policy "children_via_parent_or_admin" on public.children
  for select using (
    exists (select 1 from public.parent_child pc where pc.child_id = children.id and pc.parent_id = auth.uid())
    or public.is_admin()
  );

create or replace function public.is_parent_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('parent', 'admin')
  );
$$;

drop policy if exists "children_insert_via_parent_or_admin" on public.children;
create policy "children_insert_via_parent_or_admin" on public.children
  for insert with check (public.is_parent_or_admin());

drop policy if exists "children_update_via_parent_or_admin" on public.children;
create policy "children_update_via_parent_or_admin" on public.children
  for update using (
    exists (select 1 from public.parent_child pc where pc.child_id = children.id and pc.parent_id = auth.uid())
    or public.is_admin()
  );

-- parent_child
drop policy if exists "parent_child_select_own_or_admin" on public.parent_child;
create policy "parent_child_select_own_or_admin" on public.parent_child
  for select using (auth.uid() = parent_id or public.is_admin());

drop policy if exists "parent_child_insert_own_or_admin" on public.parent_child;
create policy "parent_child_insert_own_or_admin" on public.parent_child
  for insert with check (auth.uid() = parent_id or public.is_admin());

drop policy if exists "parent_child_delete_own_or_admin" on public.parent_child;
create policy "parent_child_delete_own_or_admin" on public.parent_child
  for delete using (auth.uid() = parent_id or public.is_admin());

-- waiting_list
drop policy if exists "waiting_list_select_admin" on public.waiting_list;
create policy "waiting_list_select_admin" on public.waiting_list
  for select using (public.is_admin());

drop policy if exists "waiting_list_update_admin" on public.waiting_list;
create policy "waiting_list_update_admin" on public.waiting_list
  for update using (public.is_admin());

-- feature_flags
drop policy if exists "feature_flags_update_admin" on public.feature_flags;
create policy "feature_flags_update_admin" on public.feature_flags
  for update using (public.is_admin());

drop policy if exists "feature_flags_insert_admin" on public.feature_flags;
create policy "feature_flags_insert_admin" on public.feature_flags
  for insert with check (public.is_admin());

-- support_requests
drop policy if exists "support_requests_admin_all" on public.support_requests;
create policy "support_requests_admin_all" on public.support_requests
  for all using (public.is_admin());
