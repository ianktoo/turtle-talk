-- Migration: 002_indexes
-- Performance indexes for common query patterns.

create index if not exists missions_child_id_created_at
  on missions (child_id, created_at desc);

create index if not exists missions_child_id_status
  on missions (child_id, status);
