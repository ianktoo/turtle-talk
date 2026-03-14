## Goal

Update the in-app menu to a centered “profile” header, keep the existing navigation items, and add a centered auth action plus an optional version/footer line.

## Scope

- Applies to `app/v2/components/Menu.tsx` (current menu dialog).
- Layout/styling only; no new routes; keep existing login/logout behavior.

## Current Behavior (baseline)

- Menu shows a “profile card” with avatar + name and a status subtext (“Logged in / Not logged in”).
- Menu items: Home, My Garden, Missions.
- Auth button is left-aligned.

## Proposed UX / Layout

### Header (top, centered)

- **Avatar**: Centered circular avatar (increase size from current 56px to ~72px).
  - Source remains the `ui-avatars.com` URL based on the displayed name.
- **Name text**: Centered, single line.
  - If logged in: use `child.firstName` (trimmed).
  - If logged out: use `Explorer` (no exclamation).
- **Remove status subtext**: Do not show “Logged in / Not logged in”.

### Menu items (middle)

- Keep items exactly as-is:
  - Home (`/`)
  - My Garden (`/garden`)
  - Missions (`/missions`)
- `MenuItem` component usage and click-to-close behavior remain unchanged.

### Auth button (below items, centered)

- Center-align the button.
- Behavior:
  - If logged out: click triggers `onOpenLogin` (and closes menu) — same as current `handleLoginClick`.
  - If logged in: click posts to `/api/child-logout`, then `refetch()`, then closes menu — same as current `handleLogoutClick`.
- Label:
  - Logged out: “Log in”
  - Logged in: “Sign out” (approved wording)

### Optional footer (bottom, centered)

- Centered, small muted text:
  - `turtletalk.io · v<version>`
- Version is sourced from `package.json` (current version: `0.1.0`).
- Footer is optional; safe to omit if version import is undesirable in client code.

## Visual/Style Notes

- Keep the existing menu container visuals (surface, radius, shadow).
- Add subtle vertical spacing and (optional) a soft divider line to separate header/items and items/footer.
- Maintain current overlay and close-on-backdrop-click behavior.

## Acceptance Criteria

- Avatar and name are centered at the top of the menu.
- When logged out, the name reads exactly “Explorer”.
- No “Logged in / Not logged in” subtext appears.
- Menu items render and behave unchanged.
- Auth button is centered and toggles between “Log in” and “Sign out” with existing behavior.
- Optional footer displays `turtletalk.io · v0.1.0` centered in muted styling.

