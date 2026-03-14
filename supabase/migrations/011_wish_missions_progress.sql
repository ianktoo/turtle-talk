-- Migration: 011_wish_missions_progress
-- Adds mission-tracking columns to child_wish_round so parents can set a missions_required
-- target when honoring a wish, and children can track progress toward realization.
-- Run after 010. Apply with: supabase db push

-- 1. Add missions_required (parent sets when honoring; default 3)
alter table public.child_wish_round
  add column if not exists missions_required int not null default 3;

-- 2. Add missions_completed (incremented as child completes missions)
alter table public.child_wish_round
  add column if not exists missions_completed int not null default 0;

-- 3. Expand the status CHECK to include 'realized'
alter table public.child_wish_round
  drop constraint if exists child_wish_round_status_check;

alter table public.child_wish_round
  add constraint child_wish_round_status_check
  check (status in ('generating', 'child_picking', 'child_picked', 'parent_choosing', 'parent_honored', 'realized'));
