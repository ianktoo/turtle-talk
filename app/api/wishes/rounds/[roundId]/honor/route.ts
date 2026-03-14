/**
 * PATCH /api/wishes/rounds/[roundId]/honor
 * Parent auth required. Body: { optionId: string }
 * Sets parent_honored_option_id, inserts parent_encouragement (decoration for child), sets round to parent_honored.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';
import { PARENT_HONORED_WISH_EMOJI } from '@/lib/garden/decoration-meanings';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roundId } = await params;
  if (!roundId) {
    return NextResponse.json({ error: 'roundId required' }, { status: 400 });
  }

  let body: { optionId?: string; missionsRequired?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const optionId = typeof body?.optionId === 'string' ? body.optionId.trim() : '';
  if (!optionId) {
    return NextResponse.json({ error: 'optionId required' }, { status: 400 });
  }
  const missionsRequired =
    typeof body?.missionsRequired === 'number' && body.missionsRequired >= 1
      ? Math.round(body.missionsRequired)
      : 3;

  const admin = getSupabaseAdminOptional();
  if (!admin) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { data: round, error: roundErr } = await (admin as any)
    .from('child_wish_round')
    .select('id, child_id, status')
    .eq('id', roundId)
    .single();

  if (roundErr || !round) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }
  const roundRow = round as { id: string; child_id: string; status: string };

  const { data: parentLink } = await supabaseUser
    .from('parent_child')
    .select('child_id')
    .eq('parent_id', user.id)
    .eq('child_id', roundRow.child_id)
    .maybeSingle();

  if (!parentLink) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (roundRow.status !== 'child_picked' && roundRow.status !== 'parent_choosing') {
    return NextResponse.json({ error: 'Round is not in child_picked or parent_choosing state' }, { status: 400 });
  }

  const { data: option } = await (admin as any)
    .from('child_wish_option')
    .select('id, round_id, selected_by_child')
    .eq('id', optionId)
    .eq('round_id', roundId)
    .single();

  if (!option || !(option as { selected_by_child?: boolean }).selected_by_child) {
    return NextResponse.json({ error: 'Option not found or not selected by child' }, { status: 400 });
  }

  await (admin as any)
    .from('child_wish_round')
    .update({
      status: 'parent_honored',
      parent_honored_option_id: optionId,
      missions_required: missionsRequired,
      missions_completed: 0,
    })
    .eq('id', roundId);

  await (admin as any).from('parent_encouragement').insert({
    child_id: roundRow.child_id,
    from_parent_id: user.id,
    emoji: PARENT_HONORED_WISH_EMOJI,
  });

  return NextResponse.json({
    roundId,
    status: 'parent_honored',
    optionId,
  });
}
