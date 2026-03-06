# Admin User Management — Design Doc

**Date:** 2026-03-05
**Status:** Implemented

## Overview

Two new sub-pages under `/admin` provide user management and waiting list (role) management for admin users. The existing admin layout already enforces the `profiles.role = 'admin'` guard, so all sub-pages are protected by default.

## Approach

Sub-pages under `/admin` — each section gets its own route with full breathing room, bookmarkable URLs, and the layout guard automatically applies to all children.

## Pages

### `/admin/users`
- Sticky header with breadcrumb (Admin / Users) and filtered count badge
- Search bar filtering by name, email, role, or status
- Full-width table: initials avatar, display name + email, role badge, status badge, suspended date, joined date
- Click any row opens a centered modal with:
  - User identity (name, email, avatar)
  - Info rows: role, access status, joined date, suspended since (if applicable)
  - 3-button access status selector (Inactive / Trial / Customer) — active state highlighted in teal
  - Promote/Demote Admin toggle button
  - Suspend/Unsuspend toggle button (red/green)
  - Optimistic UI: table row updates immediately on success

### `/admin/waiting-list`
- Sticky header with breadcrumb; amber "N pending" badge when requests need attention
- Filter pills (All / Pending / Invited / Approved / Rejected) with live counts
- Full-width table: email (monospace), status badge, joined date, invited date, action buttons
- Per-row actions are context-sensitive:
  - `pending` → Approve, Invite, Reject
  - `invited` → Approve, Reject
  - `rejected` → Approve (reversal)
  - `approved` → no actions

### `/admin` (hub — updated)
- "User management" and "Waiting list" cards are now clickable links
- "Support requests" and "Feature flags" remain "coming soon"

## API Routes

All routes require the calling user to have `profiles.role = 'admin'`. Auth check uses the server Supabase client; writes use the service-role admin client.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | Merge `auth.admin.listUsers()` (up to 1000) with `profiles` table |
| PATCH | `/api/admin/users/[id]` | Update `role`, `access_status`, and/or `suspended_at` with validation |
| GET | `/api/admin/waiting-list` | All waiting list entries, newest first |
| PATCH | `/api/admin/waiting-list/[id]` | Update status; auto-sets `invited_at`/`approved_at` + `invited_by`/`approved_by` |

## Design System

- Uses `.parent-dashboard` CSS class wrapper to inherit all `--pd-*` tokens (light + dark mode)
- SF Pro / system font stack
- Role badges: small uppercase pill (teal = admin, gray = parent, amber = child)
- Status badges: colored dot + label (green = customer, amber = trial, gray = inactive)
- Skeleton loaders via `.pd-skeleton` during fetch
- No user deletion — suspension only (data protection compliance)

## Constraints

- No delete action — suspend only
- Admin cannot demote themselves (no self-protection guard in v1; considered low risk for now)
- Pagination not implemented — assumes < 1000 users (Supabase `listUsers` default cap)
