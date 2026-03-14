# Profile Menu Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the `app/v2` menu dialog to show a centered avatar + name header, keep existing menu items, add a centered auth button, and (optionally) show `turtletalk.io · v<package.json version>` centered at the bottom.

**Architecture:** Keep the existing `Menu` component and its behaviors. Change only layout/styling and the displayed strings. Optionally import the app version from `package.json` for the footer.

**Tech Stack:** Next.js (app router), React, inline style objects, `lucide-react`.

---

## File Structure (changes)

- Modify: `app/v2/components/Menu.tsx`
  - Center header avatar + name
  - Remove status subtext
  - Center auth button + rename “Log out” → “Sign out”
  - Add optional footer (version + `turtletalk.io`)
- (Optional) No new files required. If importing `package.json` into client code is undesirable, omit the version and only show `turtletalk.io`.

---

## Chunk 1: Menu layout + strings

### Task 1: Implement header layout changes

**Files:**
- Modify: `app/v2/components/Menu.tsx`

- [ ] **Step 1: Update display name logic**
  - Ensure logged-out name is exactly `Explorer` (no `!`).
  - Keep logged-in name as `child.firstName` (trimmed).

- [ ] **Step 2: Rework header markup to be centered**
  - Avatar centered (increase size to ~72px).
  - Name centered under avatar.
  - Remove the “Logged in / Not logged in” subtext entirely.

- [ ] **Step 3: Add subtle spacing / optional divider**
  - Maintain existing menu container visuals.
  - Optional: add a soft divider line between header and items.

- [ ] **Step 4: Verify in dev**

Run: `npm run dev`

Manual checks:
- Open menu
- Logged out: avatar shows, name reads `Explorer`
- Logged in: name shows child first name
- No status subtext visible

### Task 2: Center auth button + label

**Files:**
- Modify: `app/v2/components/Menu.tsx`

- [ ] **Step 1: Center align the auth button**
  - Change `alignSelf` and margins as needed to center it under items.

- [ ] **Step 2: Update label**
  - Logged in label should read `Sign out`
  - Logged out label remains `Log in`

- [ ] **Step 3: Verify behavior unchanged**
  - Logged out: button closes menu and opens login (via `onOpenLogin`)
  - Logged in: button calls `/api/child-logout`, then `refetch()`, then closes menu

### Task 3: Optional footer (URL + version)

**Files:**
- Modify: `app/v2/components/Menu.tsx`

- [ ] **Step 1: Add a centered footer line**
  - Small muted text at bottom: `turtletalk.io · v0.1.0` (version value comes from `package.json`).

- [ ] **Step 2: Decide version sourcing implementation**
  - Option A (simple): import `version` from `package.json` (works in many Next setups, but it’s a client component so confirm bundling is ok).
  - Option B (fallback): omit version and only show `turtletalk.io`.

- [ ] **Step 3: Verify footer renders**
  - Footer centered, doesn’t crowd button/items

---

## Quality checks

- [ ] **Run lint**

Run: `npm run lint`

Expected: no new lint errors in `app/v2/components/Menu.tsx`.

- [ ] **Smoke test (manual)**
  - Backdrop click closes menu
  - Escape key closes menu
  - Menu items still navigate and close menu

---

## Handoff

Plan complete and saved to `docs/superpowers/plans/2026-03-11-profile-menu.md`. Ready to execute?

