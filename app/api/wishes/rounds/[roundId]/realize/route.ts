/**
 * PATCH /api/wishes/rounds/[roundId]/realize
 * Child session required. Marks a parent_honored wish as realized once missions are complete.
 * Inserts a parent_notification (type: wish_missions_complete) for all linked parents.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';
import { getChildSessionCookieName, parseChildSessionCookieValue } from '@/lib/child-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const cookieValue = request.cookies.get(getChildSessionCookieName())?.value;
  const session = parseChildSessionCookieValue(cookieValue);
  if (!session?.childId) {
    return NextResponse.json({ error: 'Child session required' }, { status: 401 });
  }

  const { roundId } = await params;
  if (!roundId) {
    return NextResponse.json({ error: 'roundId required' }, { status: 400 });
  }

  const admin = getSupabaseAdminOptional();
  if (!admin) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { data: round, error: roundErr } = await (admin as any)
    .from('child_wish_round')
    .select('id, child_id, status, missions_required, missions_completed')
    .eq('id', roundId)
    .eq('child_id', session.childId)
    .single();

  if (roundErr || !round) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  const row = round as {
    id: string;
    child_id: string;
    status: string;
    missions_required: number;
    missions_completed: number;
  };

  if (row.status !== 'parent_honored') {
    return NextResponse.json({ error: 'Round is not in parent_honored state' }, { status: 400 });
  }

  if (row.missions_completed < row.missions_required) {
    return NextResponse.json({ error: 'Missions not yet complete' }, { status: 400 });
  }

  await (admin as any)
    .from('child_wish_round')
    .update({ status: 'realized' })
    .eq('id', roundId);

  const { data: parents } = await (admin as any)
    .from('parent_child')
    .select('parent_id')
    .eq('child_id', row.child_id);

  if (parents && parents.length > 0) {
    const notifications = (parents as { parent_id: string }[]).map((p) => ({
      parent_id: p.parent_id,
      child_id: row.child_id,
      type: 'wish_missions_complete',
      payload: { roundId },
    }));
    await (admin as any).from('parent_notification').insert(notifications);
  }

  return NextResponse.json({ roundId, status: 'realized' });
}
