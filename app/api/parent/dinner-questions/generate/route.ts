/**
 * POST /api/parent/dinner-questions/generate
 * Body: { childId: uuid, count?: number }
 * Creates new pending dinner questions for the child (parent must own child).
 * Uses theme-based templates; does not call external LLM.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDinnerQuestions } from '@/lib/dinner-questions/generate';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { childId?: string; count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const childId = body?.childId;
  if (!childId || typeof childId !== 'string') {
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

  const count = typeof body.count === 'number' ? Math.min(10, Math.max(1, body.count)) : 5;
  const questions = generateDinnerQuestions({ count });

  const rows = questions.map((q) => ({
    parent_id: user.id,
    child_id: childId,
    question: q.question,
    theme: q.theme,
    status: 'pending',
  }));

  const { data: inserted, error } = await supabase
    .from('dinner_questions')
    .insert(rows)
    .select('id, question, theme, status, created_at');

  if (error) {
    console.error('[dinner-questions/generate]', error);
    return NextResponse.json({ error: 'Failed to create questions' }, { status: 500 });
  }

  return NextResponse.json({ questions: inserted ?? [], created: (inserted ?? []).length });
}
