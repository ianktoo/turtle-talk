/**
 * PATCH /api/admin/waiting-list/[id] — update a waiting list entry's status.
 * Requires admin role. Automatically sets invited_at/approved_at timestamps.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

const ALLOWED_STATUSES = ['pending', 'invited', 'approved', 'rejected'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status } = body;
  if (!ALLOWED_STATUSES.includes(status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status };
  if (status === 'invited') {
    update.invited_at = now;
    update.invited_by = user.id;
  } else if (status === 'approved') {
    update.approved_at = now;
    update.approved_by = user.id;
  }

  const admin = getSupabaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('waiting_list').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
