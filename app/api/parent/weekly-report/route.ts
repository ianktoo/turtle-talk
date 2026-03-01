/**
 * GET /api/parent/weekly-report?childId=uuid&weekStart=YYYY-MM-DD
 * Returns (and optionally generates) weekly report for the given child and week.
 * Parent must be authenticated and child must be linked via parent_child.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildWeeklySummaryFromMissions,
  getWeekEnd,
  type MissionForReport,
} from '@/lib/reports/weekly';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const childId = request.nextUrl.searchParams.get('childId');
  const weekStartParam = request.nextUrl.searchParams.get('weekStart');
  if (!childId || !weekStartParam) {
    return NextResponse.json(
      { error: 'childId and weekStart (YYYY-MM-DD) required' },
      { status: 400 }
    );
  }

  const weekStart = weekStartParam.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: 'weekStart must be YYYY-MM-DD' }, { status: 400 });
  }

  const weekEnd = getWeekEnd(weekStart);

  const { data: link } = await supabase
    .from('parent_child')
    .select('child_id')
    .eq('parent_id', user.id)
    .eq('child_id', childId)
    .single();

  if (!link) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const startIso = `${weekStart}T00:00:00Z`;
  const endIso = weekEnd.toISOString();

  const { data: rows } = await supabase
    .from('missions')
    .select('id, title, theme, completed_at')
    .eq('child_id', childId)
    .eq('status', 'completed')
    .gte('completed_at', startIso)
    .lt('completed_at', endIso);

  const missions: MissionForReport[] = (rows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    theme: r.theme ?? 'curious',
    completedAt: r.completed_at,
  }));

  const payload = buildWeeklySummaryFromMissions(childId, weekStart, missions);

  await supabase.from('weekly_reports').upsert(
    {
      child_id: childId,
      week_start: weekStart,
      payload,
    },
    { onConflict: 'child_id,week_start' }
  );

  return NextResponse.json(payload);
}
