/**
 * PATCH /api/wishes/rounds/[roundId]/select
 * Child session required. Body: { optionIds: string[] } (exactly 3).
 * Marks the 3 options as selected_by_child, sets round status to child_picked, notifies parents.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';
import { getChildSessionCookieName, parseChildSessionCookieValue } from '@/lib/child-session';

const SELECT_COUNT = 3;

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

  let body: { optionIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const optionIds = Array.isArray(body?.optionIds) ? body.optionIds.filter((id) => typeof id === 'string').slice(0, SELECT_COUNT) : [];
  if (optionIds.length !== SELECT_COUNT) {
    return NextResponse.json({ error: `Exactly ${SELECT_COUNT} optionIds required` }, { status: 400 });
  }

  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const childId = session.childId;

  const { data: round, error: roundErr } = await (supabase as any)
    .from('child_wish_round')
    .select('id, child_id, status')
    .eq('id', roundId)
    .eq('child_id', childId)
    .single();

  if (roundErr || !round) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }
  if ((round as { status: string }).status !== 'child_picking') {
    return NextResponse.json({ error: 'Round is not in child_picking state' }, { status: 400 });
  }

  const { data: options } = await (supabase as any)
    .from('child_wish_option')
    .select('id')
    .eq('round_id', roundId);
  const optionIdSet = new Set((options ?? []).map((o: { id: string }) => o.id));
  const validIds = optionIds.filter((id) => optionIdSet.has(id));
  if (validIds.length !== SELECT_COUNT) {
    return NextResponse.json({ error: 'Invalid optionIds for this round' }, { status: 400 });
  }

  for (const id of validIds) {
    await (supabase as any).from('child_wish_option').update({ selected_by_child: true }).eq('id', id);
  }

  await (supabase as any)
    .from('child_wish_round')
    .update({ status: 'child_picked' })
    .eq('id', roundId);

  const { data: links } = await (supabase as any)
    .from('parent_child')
    .select('parent_id')
    .eq('child_id', childId);

  if (Array.isArray(links) && links.length > 0) {
    await (supabase as any).from('parent_notification').insert(
      links.map((l: { parent_id: string }) => ({
        parent_id: l.parent_id,
        child_id: childId,
        type: 'child_picked_wishes',
        payload: {
          roundId,
          childName: session.firstName ?? 'Your child',
        },
      }))
    );
  }

  return NextResponse.json({
    roundId,
    status: 'child_picked',
    selectedOptionIds: validIds,
  });
}
