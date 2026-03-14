/**
 * GET /api/admin/waiting-list — list all waiting list entries, newest first.
 * Joins linked demo_sessions data when available.
 * Requires admin role.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'invalid_session' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = getSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entries, error } = await (admin as any)
    .from('waiting_list')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (entries ?? []) as Array<Record<string, unknown>>;

  const demoIds = rows
    .map((r) => r.demo_id)
    .filter((id): id is string => typeof id === 'string');

  let demoMap: Record<string, Record<string, unknown>> = {};

  if (demoIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: demos } = await (admin as any)
      .from('demo_sessions')
      .select('demo_id, child_name, age_group, completed_missions_count, wish_choice, topics')
      .in('demo_id', demoIds);

    if (demos) {
      for (const d of demos as Array<Record<string, unknown>>) {
        demoMap[d.demo_id as string] = d;
      }
    }
  }

  const enriched = rows.map((entry) => {
    const demo = entry.demo_id ? demoMap[entry.demo_id as string] ?? null : null;
    return { ...entry, demo };
  });

  return NextResponse.json({ entries: enriched });
}
