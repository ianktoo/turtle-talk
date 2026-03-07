/**
 * GET /api/admin/satisfaction — call feedback stats for admin.
 * Requires admin role. Reads from Supabase call_feedback table.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { err: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { err: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { err: null };
}

export async function GET() {
  const { err } = await requireAdmin();
  if (err) return err;

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from('call_feedback')
    .select('id, child_id, rating, dismissed_at, source')
    .order('dismissed_at', { ascending: false })
    .limit(500);

  if (error) {
    const isTableMissing =
      error.code === '42P01' ||
      (error as { message?: string }).message?.includes('does not exist') ||
      (error as { message?: string }).message?.includes('404');
    if (isTableMissing) {
      return NextResponse.json({
        total: 0,
        happy: 0,
        neutral: 0,
        sad: 0,
        noRating: 0,
        recent: [],
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = rows ?? [];
  const total = all.length;
  const happy = all.filter((r) => r.rating === 'happy').length;
  const neutral = all.filter((r) => r.rating === 'neutral').length;
  const sad = all.filter((r) => r.rating === 'sad').length;
  const noRating = all.filter((r) => r.rating == null).length;
  const recent = all.slice(0, 100).map((r) => ({
    id: r.id,
    childId: r.child_id,
    rating: r.rating as 'happy' | 'neutral' | 'sad' | null,
    dismissedAt: r.dismissed_at,
    source: r.source ?? '',
  }));

  return NextResponse.json({
    total,
    happy,
    neutral,
    sad,
    noRating,
    recent,
  });
}
