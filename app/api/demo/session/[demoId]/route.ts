import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';

/**
 * GET /api/demo/session/[demoId]
 * Returns a summarized view of the child demo session for the parent.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ demoId: string }> },
) {
  const { demoId: rawDemoId } = await context.params;
  const demoId = typeof rawDemoId === 'string' ? rawDemoId.trim() : '';
  if (!demoId) {
    return NextResponse.json({ error: 'demoId is required' }, { status: 400 });
  }

  const admin = getSupabaseAdminOptional();
  if (!admin) {
    return NextResponse.json({ error: 'Demo storage not configured' }, { status: 503 });
  }

  const { data, error } = await admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('demo_sessions' as any)
    .select(
      [
        'demo_id',
        'child_name',
        'age_group',
        'favorite_book',
        'fun_facts',
        'completed_missions_count',
        'wish_choice',
        'topics',
        'messages_summary',
        'created_at',
        'last_seen_at',
      ].join(', '),
    )
    .eq('demo_id', demoId)
    .maybeSingle();

  if (error) {
    console.error('[demo/session] GET', error);
    return NextResponse.json({ error: 'Failed to load demo session' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Demo session not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      session: {
        demoId: data.demo_id as string,
        childName: (data.child_name ?? null) as string | null,
        ageGroup: (data.age_group ?? null) as string | null,
        favoriteBook: (data.favorite_book ?? null) as string | null,
        funFacts: (data.fun_facts ?? null) as string[] | null,
        completedMissionsCount: (data.completed_missions_count ?? null) as number | null,
        wishChoice: (data.wish_choice ?? null) as string | null,
        topics: (data.topics ?? null) as string[] | null,
        messagesSummary: data.messages_summary ?? null,
        createdAt: (data.created_at ?? null) as string | null,
        lastSeenAt: (data.last_seen_at ?? null) as string | null,
      },
    },
    { status: 200 },
  );
}
