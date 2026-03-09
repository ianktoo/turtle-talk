-- Migration: 008_call_feedback
-- Stores "How was your call?" feedback (rating, timestamps, child_id, source).
-- RLS permissive (using (true)) — app inserts without auth; admin reads via API.

create table if not exists call_feedback (
  id             uuid primary key default gen_random_uuid(),
  child_id       text not null,
  rating         text check (rating in ('happy', 'neutral', 'sad')) null,
  dismissed_at   timestamptz not null,
  call_ended_at  timestamptz not null,
  source         text not null,
  time_to_dismiss_ms integer,
  created_at     timestamptz not null default now()
);

create index if not exists call_feedback_child_id on call_feedback (child_id);
create index if not exists call_feedback_dismissed_at on call_feedback (dismissed_at desc);

alter table call_feedback enable row level security;

drop policy if exists "call_feedback_all" on call_feedback;
create policy "call_feedback_all" on call_feedback
  for all using (true) with check (true);
