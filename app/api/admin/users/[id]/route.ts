/**
 * PATCH /api/admin/users/[id] — update role, access_status, or suspended_at for a user.
 * Requires admin role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

const ALLOWED_ROLES = ['parent', 'admin', 'child'];
const ALLOWED_STATUSES = ['inactive', 'trial', 'customer'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'invalid_session' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if ('role' in body) {
    if (!ALLOWED_ROLES.includes(body.role as string)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    update.role = body.role;
  }
  if ('access_status' in body) {
    if (!ALLOWED_STATUSES.includes(body.access_status as string)) {
      return NextResponse.json({ error: 'Invalid access_status' }, { status: 400 });
    }
    update.access_status = body.access_status;
  }
  if ('suspended_at' in body) {
    update.suspended_at = body.suspended_at ?? null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('profiles').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
