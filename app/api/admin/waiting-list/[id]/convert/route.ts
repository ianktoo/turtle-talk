/**
 * POST /api/admin/waiting-list/[id]/convert
 * Admin-only: converts a waitlist entry into a real user account.
 * - Creates an auth user (email confirmed)
 * - Profile is auto-created by the handle_new_user() trigger
 * - Updates profile access_status to 'trial'
 * - If a demo session is linked, creates a child record + parent_child link
 * - Marks the waitlist entry as converted and approved
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

function generateLoginKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let key = '';
  for (let i = 0; i < 6; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

const DEFAULT_EMOJIS = ['\u{1F422}', '\u{1F98B}', '\u{1F431}', '\u{1F436}', '\u{1F42C}', '\u{1F98A}'];

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'invalid_session' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const admin = getSupabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entry, error: fetchErr } = await (admin as any)
    .from('waiting_list')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !entry) {
    return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
  }

  if (entry.converted_user_id) {
    return NextResponse.json({ error: 'Already converted', convertedUserId: entry.converted_user_id }, { status: 409 });
  }

  // 1. Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: entry.email,
    email_confirm: true,
  });

  if (authErr) {
    return NextResponse.json({ error: `Auth error: ${authErr.message}` }, { status: 500 });
  }

  const newUserId = authData.user.id;

  // 2. Update profile to trial (small delay for trigger to complete)
  await new Promise((r) => setTimeout(r, 500));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('profiles')
    .update({ access_status: 'trial', role: 'parent' })
    .eq('id', newUserId);

  let childId: string | null = null;

  // 3. If demo session linked, create child from demo data
  if (entry.demo_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: demo } = await (admin as any)
      .from('demo_sessions')
      .select('*')
      .eq('demo_id', entry.demo_id)
      .single();

    if (demo) {
      const childName = demo.child_name || 'Child';
      const emoji = DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];
      const loginKey = generateLoginKey();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: childRow, error: childErr } = await (admin as any)
        .from('children')
        .insert({
          first_name: childName,
          emoji,
          login_key: loginKey,
        })
        .select('id')
        .single();

      if (!childErr && childRow) {
        childId = childRow.id;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from('parent_child').insert({
          parent_id: newUserId,
          child_id: childId,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from('demo_sessions')
          .update({
            parent_id: newUserId,
            child_id: childId,
            linked_at: new Date().toISOString(),
          })
          .eq('demo_id', entry.demo_id);
      }
    }
  }

  // 4. Mark waitlist entry as converted and approved
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('waiting_list')
    .update({
      converted_user_id: newUserId,
      converted_at: now,
      status: 'approved',
      approved_at: now,
      approved_by: user.id,
    })
    .eq('id', id);

  return NextResponse.json({
    success: true,
    userId: newUserId,
    childId,
  });
}
