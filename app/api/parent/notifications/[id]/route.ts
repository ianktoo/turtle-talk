/**
 * PATCH /api/parent/notifications/[id]
 * Parent auth required. Body: {} or { read: true }. Sets read_at for the notification.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const admin = getSupabaseAdminOptional();
  if (!admin) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { data: row, error: fetchErr } = await (admin as any)
    .from('parent_notification')
    .select('id, parent_id')
    .eq('id', id)
    .single();

  const r = row as { parent_id?: string } | null;
  if (fetchErr || !r || r.parent_id !== user.id) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  const { error: updateErr } = await (admin as any)
    .from('parent_notification')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  if (updateErr) {
    console.error('[parent/notifications PATCH]', updateErr);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  return NextResponse.json({ id, readAt: new Date().toISOString() });
}
