import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';

type DemoSessionPayload = {
  demoId: string;
  childName?: string | null;
  ageGroup?: string | null;
  favoriteBook?: string;
  funFacts?: string[];
  completedMissionsCount?: number;
  wishChoice?: 'solo' | 'withParent' | 'withFriend' | null;
  topics?: string[];
  messagesSummary?: unknown;
};

/**
 * POST /api/demo/session
 * Upserts a demo session record keyed by demoId.
 * Called from the demo flow on the child side so the parent view can fetch it later.
 */
export async function POST(request: NextRequest) {
  let body: DemoSessionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const demoId = typeof body.demoId === 'string' ? body.demoId.trim() : '';
  if (!demoId) {
    return NextResponse.json({ error: 'demoId is required' }, { status: 400 });
  }

  const admin = getSupabaseAdminOptional();
  if (!admin) {
    return NextResponse.json({ error: 'Demo storage not configured' }, { status: 503 });
  }

  const now = new Date().toISOString();

  const record = {
    demo_id: demoId,
    child_name: body.childName ?? null,
    age_group: body.ageGroup ?? null,
    favorite_book: body.favoriteBook ?? null,
    fun_facts: body.funFacts ?? null,
    completed_missions_count: body.completedMissionsCount ?? null,
    wish_choice: body.wishChoice ?? null,
    topics: body.topics ?? null,
    messages_summary: body.messagesSummary ?? null,
    last_seen_at: now,
  };

  const { data, error } = await admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('demo_sessions' as any)
    .upsert(record, { onConflict: 'demo_id' })
    .select('demo_id')
    .maybeSingle();

  if (error) {
    console.error('[demo/session] POST', error);
    return NextResponse.json({ error: 'Failed to save demo session' }, { status: 500 });
  }

  return NextResponse.json({ demoId: data?.demo_id ?? demoId }, { status: 200 });
}
