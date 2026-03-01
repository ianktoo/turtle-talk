-- Seed: first admin profile (ianktoo@gmail.com)
-- Prerequisite: Create the user in Supabase Dashboard (Authentication → Users → Add user)
-- with email ianktoo@gmail.com, then copy their UUID and replace YOUR_AUTH_USER_UUID below.
-- Run in Supabase SQL Editor.

insert into public.profiles (id, role, display_name, access_status)
values ('YOUR_AUTH_USER_UUID', 'admin', 'Admin', 'customer)
on conflict (id) do update set
  role = 'admin',
  access_status = 'customer',
  suspended_at = null,
  updated_at = now();
