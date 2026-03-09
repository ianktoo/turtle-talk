/**
 * GET /api/wishes/rounds — list wish rounds for the child (session).
 * Returns rounds with id, status, created_at, and honoredOption when status is parent_honored.
 * POST /api/wishes/rounds — create a new round (status: generating) for the child.
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
    return NextResponse.json({ rounds: [] }, { status: 200 });
  }

  const childId = session.childId;

  const { data: rounds, error: roundsErr } = await (supabase as any)
    .from('child_wish_round')
    .select('id, status, parent_honored_option_id, created_at')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (roundsErr) {
    console.error('[wishes/rounds] GET', roundsErr);
    return NextResponse.json({ error: 'Failed to load rounds' }, { status: 500 });
  }

  const list = (rounds ?? []) as {
    id: string;
    status: string;
    parent_honored_option_id: string | null;
    created_at: string;
  }[];

  const honoredIds = list
    .filter((r) => r.status === 'parent_honored' && r.parent_honored_option_id)
    .map((r) => r.parent_honored_option_id as string);

  let honoredOptions: { id: string; label: string }[] = [];
  if (honoredIds.length > 0) {
    const { data: opts } = await (supabase as any)
      .from('child_wish_option')
      .select('id, label')
      .in('id', honoredIds);
    honoredOptions = (opts ?? []) as { id: string; label: string }[];
  }

  const optionById = Object.fromEntries(honoredOptions.map((o) => [o.id, o]));

  const roundsWithHonored = list.map((r) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    honoredOption:
      r.status === 'parent_honored' && r.parent_honored_option_id
        ? optionById[r.parent_honored_option_id] ?? { id: r.parent_honored_option_id, label: '' }
        : undefined,
  }));

  // Include options for the first round that is child_picking or child_picked (so child can pick 3 or see selection)
  const activeForPicking = list.find((r) => r.status === 'child_picking' || r.status === 'child_picked');
  let activeOptions: { id: string; label: string; theme_slug: string; selected_by_child: boolean }[] = [];
  if (activeForPicking?.id) {
    const { data: opts } = await (supabase as any)
      .from('child_wish_option')
      .select('id, label, theme_slug, selected_by_child')
      .eq('round_id', activeForPicking.id)
      .order('sort_order', { ascending: true });
    activeOptions = (opts ?? []) as { id: string; label: string; theme_slug: string; selected_by_child: boolean }[];
  }

  return NextResponse.json({
    rounds: roundsWithHonored,
    activeRoundOptions: activeOptions.length > 0 ? activeOptions : undefined,
  });
}

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(getChildSessionCookieName())?.value;
  const session = parseChildSessionCookieValue(cookieValue);
  if (!session?.childId) {
    return NextResponse.json({ error: 'Child session required' }, { status: 401 });
  }

  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const childId = session.childId;

  const { data: round, error } = await (supabase as any)
    .from('child_wish_round')
    .insert({ child_id: childId, status: 'generating' })
    .select('id')
    .single();

  if (error) {
    console.error('[wishes/rounds] POST', error);
    return NextResponse.json({ error: 'Failed to create round' }, { status: 500 });
  }

  return NextResponse.json({ roundId: round?.id ?? null });
}
