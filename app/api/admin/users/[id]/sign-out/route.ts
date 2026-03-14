/**
 * POST /api/admin/users/[id]/sign-out — revoke all sessions for the user (sign them out everywhere).
 * Requires admin role. Uses GoTrue admin API when available.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'invalid_session' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRole) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const authUrl = `${url.replace(/\/$/, '')}/auth/v1`;
  try {
    const res = await fetch(`${authUrl}/admin/users/${id}/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRole}`,
        'Content-Type': 'application/json',
        apikey: serviceRole,
      },
      body: JSON.stringify({}),
    });
    if (res.status === 204 || res.status === 200) {
      return NextResponse.json({ success: true });
    }
    if (res.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const text = await res.text();
    return NextResponse.json(
      { error: text || 'Failed to sign out user' },
      { status: res.status >= 400 ? res.status : 500 }
    );
  } catch (err) {
    console.error('[admin sign-out]', err);
    return NextResponse.json({ error: 'Failed to sign out user' }, { status: 500 });
  }
}
