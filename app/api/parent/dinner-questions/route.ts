/**
 * GET /api/parent/dinner-questions?childId=uuid&status=pending|completed
 * List dinner questions for the selected child. Optional status filter.
 *
 * PATCH /api/parent/dinner-questions
 * Body: { id: uuid }. Marks the question as completed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const childId = request.nextUrl.searchParams.get('childId');
  const status = request.nextUrl.searchParams.get('status'); // optional: pending | completed
  if (!childId) {
    return NextResponse.json({ error: 'childId required' }, { status: 400 });
  }

  const { data: link } = await supabase
    .from('parent_child')
    .select('child_id')
    .eq('parent_id', user.id)
    .eq('child_id', childId)
    .single();

  if (!link) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let q = supabase
    .from('dinner_questions')
    .select('id, question, theme, status, created_at, completed_at')
    .eq('child_id', childId)
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false });

  if (status === 'pending' || status === 'completed') {
    q = q.eq('status', status);
  }

  const { data: rows, error } = await q;

  if (error) {
    console.error('[dinner-questions GET]', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }

  return NextResponse.json({ questions: rows ?? [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const id = body?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from('dinner_questions')
    .select('id, parent_id, status')
    .eq('id', id)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }
  if (row.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (row.status === 'completed') {
    return NextResponse.json({ success: true }); // idempotent
  }

  const { error: updateErr } = await supabase
    .from('dinner_questions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('parent_id', user.id);

  if (updateErr) {
    console.error('[dinner-questions PATCH]', updateErr);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
