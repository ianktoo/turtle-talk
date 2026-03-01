-- Migration: 005_auth_handle_new_user
-- Auto-create a profile when a new user signs up (auth.users insert).
-- Run after 003. Uses SECURITY DEFINER so the trigger can insert into public.profiles.
-- Run with: supabase db push  OR  paste into the Supabase SQL editor.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name, access_status)
  values (
    new.id,
    'parent',
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    ),
    'inactive'
  );
  return new;
end;
$$;

-- Trigger: after insert on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
