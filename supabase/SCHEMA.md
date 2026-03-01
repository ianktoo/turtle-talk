# Public schema reference

Current `public` schema as defined by migrations 001–005. Use this to compare with the live DB (e.g. via Supabase MCP `list_tables` / `execute_sql` or Dashboard).

## Tables

| Table | Purpose |
|-------|---------|
| **missions** | Child missions (title, description, theme, difficulty, status, completed_at). `child_id` is text (legacy device id or children.id uuid string). |
| **child_memory** | Per-child conversation memory (messages, topics). `child_id` text. |
| **profiles** | Extends auth.users. role (parent/child/admin), display_name, access_status (inactive/trial/customer), suspended_at. |
| **children** | Parent-managed child profiles: first_name, emoji, login_key (6-char alphanumeric, unique). |
| **parent_child** | Links parents to children. PK (parent_id, child_id). |
| **waiting_list** | Email signups: email, status (pending/invited/approved/rejected), invited_at, invited_by, approved_at, approved_by. |
| **feature_flags** | key (PK), enabled, updated_at. |
| **support_requests** | user_id, subject, body, status (open/in_progress/resolved). |
| **weekly_reports** | child_id, week_start, payload (jsonb). Unique (child_id, week_start). |
| **dinner_questions** | parent_id, child_id, question, theme, status (pending/completed), completed_at. |

## Indexes (002 + 004)

- `missions(child_id, created_at desc)`
- `missions(child_id, status)`
- `weekly_reports(child_id, week_start desc)`
- `dinner_questions(child_id, status)`

## Database function and trigger (005)

- **`public.handle_new_user()`**: Trigger on `auth.users` (after insert). Inserts into `public.profiles` with `role = 'parent'`, `access_status = 'inactive'`, and `display_name` from `raw_user_meta_data` or email. Ensures every new user has a profile.

## RLS

- **missions**, **child_memory**: currently permissive `(true)`. Plan: restrict by parent_child when auth is on.
- **profiles**: select/update own; admin all.
- **children**: parents see only via parent_child; admin all.
- **parent_child**: select/insert/delete own or admin.
- **waiting_list**: insert anyone; select/update admin only.
- **feature_flags**: select all; insert/update admin only.
- **support_requests**: user own; admin all.
- **weekly_reports**, **dinner_questions**: parent for linked children; admin all.
