/**
 * GET /api/parent/wish-rounds
 * Parent auth required. Query: childId (required). Returns the active wish round for that child (child_picked or parent_choosing) with the 3 selected options.
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

  const url = new URL(request.url);
  const childId = url.searchParams.get('childId')?.trim();
  if (!childId) {
    return NextResponse.json({ error: 'childId required' }, { status: 400 });
  }

  const { data: link } = await supabase
    .from('parent_child')
    .select('child_id')
    .eq('parent_id', user.id)
    .eq('child_id', childId)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdminOptional();
  if (!admin) {
    return NextResponse.json({ wishRound: null }, { status: 200 });
  }

  const { data: round, error: roundErr } = await admin
    .from('child_wish_round')
    .select('id, status, parent_honored_option_id, created_at')
    .eq('child_id', childId)
    .in('status', ['child_picked', 'parent_choosing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundErr || !round) {
    return NextResponse.json({ wishRound: null }, { status: 200 });
  }

  type RoundRow = { id: string; status: string; parent_honored_option_id: string | null; created_at: string };
  const r = round as RoundRow;
  const { data: options } = await admin
    .from('child_wish_option')
    .select('id, label, theme_slug, selected_by_child')
    .eq('round_id', r.id)
    .eq('selected_by_child', true)
    .order('sort_order', { ascending: true });

  const selectedOptions = (options ?? []).map((o: { id: string; label: string; theme_slug: string }) => ({
    id: o.id,
    label: o.label,
    theme_slug: o.theme_slug,
  }));

  return NextResponse.json({
    wishRound: {
      id: r.id,
      status: r.status,
      parentHonoredOptionId: r.parent_honored_option_id,
      createdAt: r.created_at,
      selectedOptions,
    },
  });
}
