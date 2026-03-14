-- Migration: 011_waitlist_demo_link
-- Links waiting_list entries to demo sessions so admins can see which parent
-- demoed with which child, and track conversion to real accounts.

ALTER TABLE public.waiting_list
  ADD COLUMN IF NOT EXISTS demo_id text REFERENCES public.demo_sessions(demo_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;
