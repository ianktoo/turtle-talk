# Implementation options: parent auth, roles, co-parent, UI

## Database: parent–child association

- **How it works:** Parent signs in with Supabase Auth → `auth.uid()` = `profiles.id`. Rows in `parent_child (parent_id, child_id)` link that parent to children. Adding a child (POST /api/parent/children) inserts into `children` and `parent_child` with `parent_id = auth.uid()`.
- **Conclusion:** Parent login is required to associate a parent with children; the app already does this. Ensure `/parent` is only reachable when authenticated (redirect to `/login` if not).

---

## Roles (from `supabase/migrations/003_profiles_children_waiting_list.sql`)

| Role     | Definition |
|----------|------------|
| `parent` | Default for new users. Can manage own children (via `parent_child`), view weekly reports and dinner questions. |
| `child`  | Reserved for future child accounts (e.g. in-app child profile linked to auth). Not used for device child login (that uses `children.login_key`). |
| `admin`  | Can manage all profiles, waiting list, feature flags, support requests; can see all children. |

Defined in DB as: `check (role in ('parent', 'child', 'admin'))`.

---

## Parent sign-up / login: options

### Option A — Email OTP (current, code not URL)

- **Current:** `signInWithOtp({ email })` then `verifyOtp({ email, token, type: 'email' })`. User enters 8-digit code; no magic link required in UI.
- **To use “code not URL”:** In Supabase Dashboard → Authentication → Email Templates, set the OTP template to send a **numeric code** in the body (e.g. “Your code is: {{ .Token }}”) and optionally omit or de-emphasise the link. The app already ignores the link and only uses the code.
- **Recommendation:** Keep email OTP; change the Supabase email template so the primary CTA is “Enter this code: XXXXXXXX” (and optionally still include the link as fallback). No app code change needed.

### Option B — Phone (SMS) OTP with Plivo

- **Feasibility:** Supabase Auth supports `signInWithOtp({ phone: '+1...' })`. Supabase does **not** send SMS itself; you must use a custom SMS sender (e.g. Edge Function or API route) that calls Plivo.
- **Flow:** (1) User enters phone → call Supabase to create OTP (or store OTP in DB yourself). (2) Your API/Edge Function sends SMS via Plivo with the code. (3) User enters code → verify with Supabase (if using Supabase phone) or your own verify endpoint.
- **Option B1 — Supabase + custom SMS:** Use Supabase’s phone OTP; implement a Supabase Edge Function triggered on auth events (or a webhook) that sends the OTP via Plivo. Requires mapping Supabase’s internal OTP to your SMS (Supabase may not expose the OTP in a webhook; verify current Supabase docs).
- **Option B2 — Own phone OTP:** Store OTP in a table (e.g. `phone_otps`: phone, code, expires_at). API route “send code” generates OTP, stores it, sends SMS via Plivo. API route “verify” checks code and then create/link Supabase user (e.g. with `signUp` or admin `createUser`) and set `phone` on the user. More control; more code.
- **Recommendation:** For “easy parent sign-up”, **Option A (email code)** is simpler and already in place; tune the Supabase template. Add **Option B (phone)** later if needed, using **B2** (own OTP + Plivo) for full control and to reuse existing `SMS_PROVIDER=plivo` and Plivo env vars.

---

## Co-parent

- **Model:** One child can have many parents: multiple rows in `parent_child` with the same `child_id` and different `parent_id`. So “add co-parent” = add another parent to the same child(ren).
- **Flow options:**
  - **Invite by email/phone:** Parent A invites “email@example.com” (or phone). Create a row in an `parent_invites` table (inviter_id, invitee_email_or_phone, status: pending/accepted, child_ids[] or “all my children”). Invitee signs up or logs in; an “Accept invite” flow adds their `profile.id` to `parent_child` for those children. Optional: send email/SMS with link to accept.
  - **Share link (simpler):** Parent A generates a time-limited link (e.g. token in DB). Co-parent opens link, signs in (or signs up), and is linked to the same children. No separate “invites” table if token encodes child_ids and inviter_id.
- **Recommendation:** Start with “Invite by email”: `parent_invites` table + API to create invite and to accept (after login). Co-parent menu item opens a modal to enter email and send invite; “Accept invite” page reads token and inserts into `parent_child`.

---

## UI plan (parent dashboard)

- **Navbar:** Replace plain “Parent Dashboard” + “Add child” with a **parent context icon** (avatar or initial) on the right. Click opens dropdown:
  - Line 1: **Display name or email** (or phone when available) — from profile / auth.
  - **Children** → Opens **Children modal** (add/remove children; each row: brave emoji + child name + login code; remove button).
  - **Co-parent** → Opens Co-parent modal (invite by email; placeholder or full flow).
  - **Log off** → Signs out (Supabase), redirect to `/` or `/login`.
- **Children modal:** List of children with emoji, name, login code (copyable). “Add child” button (current add flow). “Remove” per child = unlink from current parent (DELETE from `parent_child`; do not delete `children` row if other parents are linked, or offer “Remove from my account” vs “Delete child”).
- **Clean-up:** Move “Add child” out of the main header into the Children modal only. Keep child switcher (dropdown to pick active child for the dashboard content) as is or inside the same modal for consistency.

---

## Implementation summary

| Item              | Action |
|-------------------|--------|
| Roles             | Documented; no code change. |
| Parent association| Already correct; add auth guard on `/parent`. |
| Email login       | Keep; recommend changing Supabase email template to code-first. |
| Phone login       | Optional later; use own OTP + Plivo (Option B2). |
| Co-parent         | DB supports multiple parents per child; add invite flow (table + API + accept page). |
| Parent UI         | ParentHeader with icon + dropdown; Children modal (emoji + login code, add/remove); Co-parent menu item + modal. |
