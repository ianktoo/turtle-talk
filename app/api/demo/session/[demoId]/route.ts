import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';

interface DemoSessionRow {
  demo_id: string;
  child_name: string | null;
  age_group: string | null;
  favorite_book: string | null;
  fun_facts: string[] | null;
  completed_missions_count: number | null;
  wish_choice: string | null;
  topics: string[] | null;
  messages_summary: unknown;
  created_at: string | null;
  last_seen_at: string | null;
}

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (admin as any)
    .from('demo_sessions')
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
    .maybeSingle()) as { data: DemoSessionRow | null; error: { message: string } | null };

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
        demoId: data.demo_id,
        childName: data.child_name ?? null,
        ageGroup: data.age_group ?? null,
        favoriteBook: data.favorite_book ?? null,
        funFacts: data.fun_facts ?? null,
        completedMissionsCount: data.completed_missions_count ?? null,
        wishChoice: data.wish_choice ?? null,
        topics: data.topics ?? null,
        messagesSummary: data.messages_summary ?? null,
        createdAt: data.created_at ?? null,
        lastSeenAt: data.last_seen_at ?? null,
      },
    },
    { status: 200 },
  );
}
