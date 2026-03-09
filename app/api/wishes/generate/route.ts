/**
 * POST /api/wishes/generate
 * Child session required. Body: { roundId: string }
 * Generates 5 wish options for the round, writes to child_wish_option, sets round status to child_picking.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';
import { getChildSessionCookieName, parseChildSessionCookieValue } from '@/lib/child-session';
import { generateWishOptions } from '@/lib/wishes/generate-wishes';

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(getChildSessionCookieName())?.value;
  const session = parseChildSessionCookieValue(cookieValue);
  if (!session?.childId) {
    return NextResponse.json({ error: 'Child session required' }, { status: 401 });
  }

  let body: { roundId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const roundId = typeof body?.roundId === 'string' ? body.roundId.trim() : '';
  if (!roundId) {
    return NextResponse.json({ error: 'roundId required' }, { status: 400 });
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
  const roundRow = round as { id: string; child_id: string; status: string };
  if (roundRow.status !== 'generating' && roundRow.status !== 'child_picking') {
    return NextResponse.json({ error: 'Round not in generating or child_picking state' }, { status: 400 });
  }

  // Collect previous labels (honored or selected by child) for this child to avoid duplicates
  const { data: allRounds } = await (supabase as any)
    .from('child_wish_round')
    .select('id, parent_honored_option_id')
    .eq('child_id', childId);
  const roundIds = (allRounds ?? []).map((r: { id: string }) => r.id);
  const honoredIds = (allRounds ?? [])
    .filter((r: { parent_honored_option_id: string | null }) => r.parent_honored_option_id)
    .map((r: { parent_honored_option_id: string }) => r.parent_honored_option_id);
  let previousLabels: string[] = [];
  if (roundIds.length > 0) {
    const { data: opts } = await (supabase as any)
      .from('child_wish_option')
      .select('id, label, selected_by_child')
      .in('round_id', roundIds);
    const options = (opts ?? []) as { id: string; label: string; selected_by_child?: boolean }[];
    const honoredSet = new Set(honoredIds);
    previousLabels = options
      .filter((o) => o.selected_by_child || honoredSet.has(o.id))
      .map((o) => o.label)
      .filter(Boolean);
  }

  // Look up this child's remembered topics (things they like talking about)
  // from child_memory and pass them into wish generation as favourite hooks.
  let favoriteTopics: string[] = [];
  try {
    const { data: memory, error: memErr } = await (supabase as any)
      .from('child_memory')
      .select('topics')
      .eq('child_id', childId)
      .maybeSingle();
    if (!memErr && memory?.topics && Array.isArray(memory.topics)) {
      favoriteTopics = (memory.topics as string[]).slice(0, 15);
    }
  } catch (e) {
    // If the table is missing or any error occurs, continue gracefully without favourites.
    console.warn('[wishes/generate] child_memory lookup failed, continuing without favourites', e);
  }

  const options = await generateWishOptions(previousLabels, favoriteTopics);

  // Delete existing options for this round (for "regenerate")
  await (supabase as any).from('child_wish_option').delete().eq('round_id', roundId);

  const rows = options.map((o, i) => ({
    round_id: roundId,
    label: o.label,
    theme_slug: o.theme_slug,
    sort_order: i,
    selected_by_child: false,
  }));

  const { error: insertErr } = await (supabase as any)
    .from('child_wish_option')
    .insert(rows);

  if (insertErr) {
    console.error('[wishes/generate] insert options', insertErr);
    return NextResponse.json({ error: 'Failed to save wishes' }, { status: 500 });
  }

  const { error: updateErr } = await (supabase as any)
    .from('child_wish_round')
    .update({ status: 'child_picking' })
    .eq('id', roundId);

  if (updateErr) {
    console.error('[wishes/generate] update round', updateErr);
  }

  const { data: inserted } = await (supabase as any)
    .from('child_wish_option')
    .select('id, label, theme_slug, sort_order')
    .eq('round_id', roundId)
    .order('sort_order', { ascending: true });

  return NextResponse.json({
    roundId,
    status: 'child_picking',
    options: inserted ?? [],
  });
}
