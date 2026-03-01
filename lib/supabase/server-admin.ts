/**
 * Server-only Supabase client with service role key.
 * Use only in API routes or server code that must bypass RLS (e.g. child login lookup).
 * Never expose this client to the browser.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AdminDatabase } from './admin-database';

let adminClient: SupabaseClient<AdminDatabase> | null = null;

export function getSupabaseAdmin(): SupabaseClient<AdminDatabase> {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for admin operations'
    );
  }
  adminClient = createClient<AdminDatabase>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/**
 * Optional: returns null if service role is not configured (e.g. dev without Supabase Auth).
 */
export function getSupabaseAdminOptional(): SupabaseClient<AdminDatabase> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return getSupabaseAdmin();
}
