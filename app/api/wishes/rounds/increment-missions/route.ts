/**
 * POST /api/wishes/rounds/increment-missions
 * Child session required. Increments missions_completed on the active parent_honored wish round.
 * Returns the updated missions_completed count, or null if no active honored round.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';
import { getChildSessionCookieName, parseChildSessionCookieValue } from '@/lib/child-session';

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(getChildSessionCookieName())?.value;
  const session = parseChildSessionCookieValue(cookieValue);
  if (!session?.childId) {
    return NextResponse.json({ error: 'Child session required' }, { status: 401 });
  }

  const admin = getSupabaseAdminOptional();
  if (!admin) {
    return NextResponse.json({ updated: null });
  }

  const { data: round } = await (admin as any)
    .from('child_wish_round')
    .select('id, missions_completed')
    .eq('child_id', session.childId)
    .eq('status', 'parent_honored')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!round) {
    return NextResponse.json({ updated: null });
  }

  const row = round as { id: string; missions_completed: number };
  const newCount = row.missions_completed + 1;

  await (admin as any)
    .from('child_wish_round')
    .update({ missions_completed: newCount })
    .eq('id', row.id);

  return NextResponse.json({ updated: newCount, roundId: row.id });
}
