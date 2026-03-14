/**
 * GET /api/admin/users/[id]/sessions — whether the user has active session(s).
 * Requires admin role. Returns { active: boolean, count?: number }.
 * Note: Supabase JS client does not expose listUserSessions; we use a heuristic
 * (getUserById last_sign_in_at) or return active: false until API support exists.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'invalid_session' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { data: targetUser, error } = await admin.auth.admin.getUserById(id);
  if (error || !targetUser?.user) {
    return NextResponse.json({ active: false, count: 0 });
  }
  const lastSignIn = targetUser.user.last_sign_in_at;
  const hasRecentSignIn = lastSignIn
    ? Date.now() - new Date(lastSignIn).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;
  return NextResponse.json({
    active: hasRecentSignIn,
    count: hasRecentSignIn ? 1 : 0,
  });
}
