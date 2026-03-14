/**
 * GET /api/admin/users — list all auth users merged with their profiles.
 * Requires admin role.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, err: NextResponse.json({ error: 'Unauthorized', code: 'invalid_session' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { user: null, err: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, err: null };
}

export async function GET() {
  const { err } = await requireAdmin();
  if (err) return err;

  const admin = getSupabaseAdmin();

  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles, error: profilesError } = await (admin as any).from('profiles').select('*');
  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  const profilesById = Object.fromEntries(
    ((profiles as Array<Record<string, unknown>>) ?? []).map((p) => [p.id, p])
  );

  const users = (authData?.users ?? []).map((u) => {
    const p = profilesById[u.id] as Record<string, unknown> | undefined;
    return {
      id: u.id,
      email: u.email ?? null,
      display_name: (p?.display_name as string | null) ?? null,
      role: (p?.role as string) ?? 'parent',
      access_status: (p?.access_status as string) ?? 'inactive',
      suspended_at: (p?.suspended_at as string | null) ?? null,
      created_at: (p?.created_at as string) ?? u.created_at,
    };
  });

  return NextResponse.json({ users });
}
