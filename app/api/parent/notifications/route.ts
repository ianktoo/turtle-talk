/**
 * GET /api/parent/notifications
 * Parent auth required. Returns notifications for the current parent (unread first).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdminOptional();
  if (!admin) {
    return NextResponse.json({ notifications: [] }, { status: 200 });
  }

  const { data: list, error } = await (admin as any)
    .from('parent_notification')
    .select('id, child_id, type, payload, read_at, created_at')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[parent/notifications]', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }

  type NotifRow = { id: string; child_id: string; type: string; payload?: unknown; read_at?: string | null; created_at?: string | null };
  const notifications = ((list ?? []) as NotifRow[]).map((n) => ({
    id: n.id,
    childId: n.child_id,
    type: n.type,
    payload: n.payload ?? {},
    readAt: n.read_at,
    createdAt: n.created_at,
  }));

  return NextResponse.json({ notifications });
}
