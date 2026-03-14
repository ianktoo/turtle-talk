/**
 * GET /api/parent/me — current parent profile for header (display name, email).
 * Requires auth.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'invalid_session' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    displayName: profile?.display_name ?? user.email?.split('@')[0] ?? 'Parent',
  });
}
