-- Seed: default feature flags
-- Run after migrations 003 (or 004). Safe to run multiple times (upsert by key).
-- Execute in Supabase SQL Editor.

insert into public.feature_flags (key, enabled, updated_at)
values
  ('require_waiting_list_approval', false, now()),
  ('dinner_questions_enabled', true, now())
on conflict (key) do update set
  updated_at = now();
