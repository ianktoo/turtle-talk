/**
 * POST /api/missions/complete
 * Child session required. Body: { missionId: string }
 * Updates mission status to completed, increments growth cycle; if cycle reaches 3, creates wish round + parent notification.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';
import { getChildSessionCookieName, parseChildSessionCookieValue } from '@/lib/child-session';

const MISSIONS_PER_GROWTH = 3;

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(getChildSessionCookieName())?.value;
  const session = parseChildSessionCookieValue(cookieValue);
  if (!session?.childId) {
    return NextResponse.json({ error: 'Child session required' }, { status: 401 });
  }

  let body: { missionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const missionId = typeof body?.missionId === 'string' ? body.missionId.trim() : '';
  if (!missionId) {
    return NextResponse.json({ error: 'missionId required' }, { status: 400 });
  }

  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const childId = session.childId;

  // Update mission to completed (missions table uses child_id as text)
  const { error: missionError } = await (supabase as any)
    .from('missions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', missionId)
    .eq('child_id', childId);

  if (missionError) {
    console.error('[missions/complete] update mission', missionError);
    return NextResponse.json({ error: 'Failed to complete mission' }, { status: 500 });
  }

  // Upsert child_growth_cycle and increment
  const { data: existing } = await supabase
    .from('child_growth_cycle')
    .select('missions_completed_in_cycle')
    .eq('child_id', childId)
    .maybeSingle();

  const row = existing as { missions_completed_in_cycle?: number } | null;
  const nextCount = (row?.missions_completed_in_cycle ?? 0) + 1;

  const cycleRow: {
    child_id: string;
    missions_completed_in_cycle: number;
    last_growth_at?: string | null;
    updated_at: string;
  } = {
    child_id: childId,
    missions_completed_in_cycle: nextCount >= MISSIONS_PER_GROWTH ? 0 : nextCount,
    updated_at: new Date().toISOString(),
  };
  if (nextCount >= MISSIONS_PER_GROWTH) {
    cycleRow.last_growth_at = new Date().toISOString();
  }

  const { error: cycleError } = await (supabase as any)
    .from('child_growth_cycle')
    .upsert(cycleRow, { onConflict: 'child_id' });

  if (cycleError) {
    console.error('[missions/complete] upsert cycle', cycleError);
    return NextResponse.json({ error: 'Failed to update cycle' }, { status: 500 });
  }

  let wishRoundId: string | null = null;

  if (nextCount >= MISSIONS_PER_GROWTH) {
    // Create wish round (status: generating — client will call generate)
    const { data: round, error: roundError } = await (supabase as any)
      .from('child_wish_round')
      .insert({ child_id: childId, status: 'generating' })
      .select('id')
      .single();

    if (roundError) {
      console.error('[missions/complete] create round', roundError);
    } else {
      wishRoundId = round?.id ?? null;
    }

    // Notify all parents linked to this child
    if (wishRoundId) {
      const { data: links } = await (supabase as any)
        .from('parent_child')
        .select('parent_id')
        .eq('child_id', childId);

      if (Array.isArray(links) && links.length > 0) {
        await (supabase as any).from('parent_notification').insert(
          links.map((l: { parent_id: string }) => ({
            parent_id: l.parent_id,
            child_id: childId,
            type: 'growth_moment',
            payload: {
              roundId: wishRoundId,
              childName: session.firstName ?? 'Your child',
            },
          }))
        );
      }
    }
  }

  return NextResponse.json({
    completed: true,
    missionsCompletedInCycle: nextCount >= MISSIONS_PER_GROWTH ? 0 : nextCount,
    growthMoment: nextCount >= MISSIONS_PER_GROWTH,
    wishRoundId,
  });
}
