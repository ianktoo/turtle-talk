/**
 * GET /api/garden/state
 * Child session required. Returns growth cycle, active wish round, and options (if child_picking).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';
import { getChildSessionCookieName, parseChildSessionCookieValue } from '@/lib/child-session';

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(getChildSessionCookieName())?.value;
  const session = parseChildSessionCookieValue(cookieValue);
  if (!session?.childId) {
    return NextResponse.json({ error: 'Child session required' }, { status: 401 });
  }

  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    return NextResponse.json(
      { missionsCompletedInCycle: 0, activeWishRound: null, options: [] },
      { status: 200 }
    );
  }

  const childId = session.childId;

  const [cycleRes, roundRes, realizedRes] = await Promise.all([
    supabase
      .from('child_growth_cycle')
      .select('missions_completed_in_cycle, last_growth_at')
      .eq('child_id', childId)
      .maybeSingle(),
    supabase
      .from('child_wish_round')
      .select('id, status, created_at, missions_required, missions_completed')
      .eq('child_id', childId)
      .in('status', ['generating', 'child_picking', 'child_picked', 'parent_choosing', 'parent_honored'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('child_wish_round')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('status', 'realized'),
  ]);

  const cycle = cycleRes.data as { missions_completed_in_cycle?: number; last_growth_at?: string | null } | null;
  const round = roundRes.data as { id: string; status: string; created_at: string; missions_required: number; missions_completed: number } | null;
  const realizedCount = realizedRes.count ?? 0;
  const missionsCompletedInCycle = cycle?.missions_completed_in_cycle ?? 0;

  let options: { id: string; label: string; theme_slug: string; selected_by_child: boolean }[] = [];
  if (round?.id && ['child_picking', 'child_picked', 'parent_choosing', 'parent_honored'].includes(round.status)) {
    const { data: opts } = await supabase
      .from('child_wish_option')
      .select('id, label, theme_slug, selected_by_child')
      .eq('round_id', round.id)
      .order('sort_order', { ascending: true });
    const rows = (opts ?? []) as { id: string; label: string; theme_slug: string; selected_by_child?: boolean }[];
    options = rows.map((o) => ({
      id: o.id,
      label: o.label,
      theme_slug: o.theme_slug,
      selected_by_child: o.selected_by_child ?? false,
    }));
  }

  return NextResponse.json({
    missionsCompletedInCycle: missionsCompletedInCycle,
    lastGrowthAt: cycle?.last_growth_at ?? null,
    activeWishRound: round
      ? {
          id: round.id,
          status: round.status,
          created_at: round.created_at,
          missions_required: round.missions_required,
          missions_completed: round.missions_completed,
        }
      : null,
    options,
    realizedCount,
  });
}
