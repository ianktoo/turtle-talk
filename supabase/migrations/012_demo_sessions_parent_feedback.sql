-- Migration: 012_demo_sessions_parent_feedback
-- Adds parent feedback columns to demo_sessions so the parent demo
-- experience can collect feedback and interest separately from the child.

alter table public.demo_sessions
  add column if not exists parent_feedback text,
  add column if not exists parent_wants_full_version boolean;
