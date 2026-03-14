'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Call when a parent or admin API returns 401 (invalid/expired session).
 * Signs out and redirects to /login so the user is not left in a half-authenticated state.
 */
export async function handleInvalidSession(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.replace('/login');
}

/**
 * Check a fetch response for 401 and handle invalid session.
 * Use after fetch() for /api/parent/* or /api/admin/*.
 * Returns true if 401 was handled (caller should not use the response), false otherwise.
 */
export async function checkResponseForInvalidSession(res: Response): Promise<boolean> {
  if (res.status === 401) {
    await handleInvalidSession();
    return true;
  }
  return false;
}
