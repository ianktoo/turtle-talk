/**
 * GET /api/parent/children — list children linked to the current parent.
 * POST /api/parent/children — add a child (body: { firstName, emoji }).
 * Requires auth (parent or admin).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateLoginKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 6; i++) key += chars[bytes[i]! % chars.length];
  } else {
    for (let i = 0; i < 6; i++) key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: links, error: linkError } = await supabase
    .from('parent_child')
    .select('child_id')
    .eq('parent_id', user.id);

  if (linkError) {
    console.error('[parent/children]', linkError);
    return NextResponse.json({ error: 'Failed to load children' }, { status: 500 });
  }

  const childIds = (links ?? []).map((r) => r.child_id);
  if (childIds.length === 0) {
    return NextResponse.json({ children: [] });
  }

  const { data: children, error: childError } = await supabase
    .from('children')
    .select('id, first_name, emoji, login_key, created_at')
    .in('id', childIds)
    .order('created_at', { ascending: false });

  if (childError) {
    console.error('[parent/children]', childError);
    return NextResponse.json({ error: 'Failed to load children' }, { status: 500 });
  }

  const withCounts = await Promise.all(
    (children ?? []).map(async (c) => {
      const { count } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', c.id)
        .eq('status', 'completed');
      return {
        id: c.id,
        name: c.first_name,
        age: 0,
        avatar: c.emoji,
        completedMissions: count ?? 0,
        loginKey: c.login_key,
      };
    })
  );

  return NextResponse.json({ children: withCounts });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  if (role !== 'parent' && role !== 'admin') {
    const msg = profile == null
      ? 'No profile found for your account. If you are an admin, run the admin seed script (see supabase/scripts/seed_admin.sql or seed-admin.mjs).'
      : 'Only parents or admins can add children. Your role is: ' + role;
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const body = await request.json();
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const emoji = typeof body.emoji === 'string' ? body.emoji.trim() || '🐢' : '🐢';
  if (!firstName) {
    return NextResponse.json({ error: 'First name is required' }, { status: 400 });
  }

  const loginKey = generateLoginKey();
  const { data: child, error: insertError } = await supabase
    .from('children')
    .insert({ first_name: firstName, emoji, login_key: loginKey })
    .select('id, first_name, emoji, login_key')
    .single();

  if (insertError) {
    console.error('[parent/children]', insertError);
    const message = insertError.message || 'Could not add child';
    return NextResponse.json({ error: message, code: insertError.code }, { status: 500 });
  }

  const { error: linkError } = await supabase
    .from('parent_child')
    .insert({ parent_id: user.id, child_id: child.id });

  if (linkError) {
    console.error('[parent/children] link', linkError);
    await supabase.from('children').delete().eq('id', child.id);
    const message = linkError.message || 'Could not link child';
    return NextResponse.json({ error: message, code: linkError.code }, { status: 500 });
  }

  return NextResponse.json({
    child: {
      id: child.id,
      name: child.first_name,
      avatar: child.emoji,
      loginKey: child.login_key,
      completedMissions: 0,
    },
  });
}
