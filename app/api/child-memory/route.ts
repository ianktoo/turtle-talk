/**
 * GET /api/child-memory
 * Returns conversation memory (messages, childName, topics) for the current child session from Supabase.
 * Used by the conversation history page when the child is logged in.
 * Returns empty data when no session (caller can fall back to localStorage).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getChildSessionCookieName, parseChildSessionCookieValue } from '@/lib/child-session';

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(getChildSessionCookieName())?.value;
  const session = parseChildSessionCookieValue(cookieValue);
  if (!session) {
    return NextResponse.json(
      { messages: [], childName: null, topics: [] },
      { status: 200 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    );
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('child_memory')
    .select('child_name, messages, topics')
    .eq('child_id', session.childId)
    .maybeSingle();

  if (error) {
    const isTableMissing =
      error.code === '42P01' ||
      (error as { message?: string }).message?.includes('does not exist') ||
      (error as { message?: string }).message?.includes('404');
    if (isTableMissing) {
      return NextResponse.json(
        { messages: [], childName: null, topics: [] },
        { status: 200 }
      );
    }
    console.error('[child-memory] GET', error);
    return NextResponse.json(
      { error: 'Failed to load memory' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    messages: data?.messages ?? [],
    childName: data?.child_name ?? null,
    topics: data?.topics ?? [],
  });
}
