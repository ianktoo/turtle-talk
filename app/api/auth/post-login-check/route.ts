/**
 * GET /api/auth/post-login-check
 * Call after OTP verify. Checks profile (suspended? access_status?) and waiting_list.
 * If allowed, ensures profile exists. Returns { allowed: boolean, reason?: string }.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminOptional } from '@/lib/supabase/server-admin';
import type { AdminDatabase } from '@/lib/supabase/admin-database';
import type { SupabaseClient } from '@supabase/supabase-js';

type ProfileRow = { id: string; role: string; access_status: string; suspended_at: string | null };
/** Query result shape for feature_flags (select enabled). */
type FeatureFlagRow = { enabled: boolean } | null;
/** Query result shape for waiting_list (select status). */
type WaitingListRow = { status: string } | null;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ allowed: false, reason: 'not_authenticated' });
    }

    const admin = getSupabaseAdminOptional() as SupabaseClient<AdminDatabase> | null;
    if (!admin) {
      return NextResponse.json({ allowed: true }); // no admin config: allow
    }

    const { data } = await admin
      .from('profiles')
      .select('id, role, access_status, suspended_at')
      .eq('id', user.id)
      .single();

    const profile = data as ProfileRow | null;
    if (profile) {
      if (profile.suspended_at) {
        return NextResponse.json({ allowed: false, reason: 'suspended' });
      }
      // If profile was created by trigger with access_status inactive, upgrade when approved
      if (profile.access_status === 'inactive') {
        const { data: flagData } = await admin
          .from('feature_flags')
          .select('enabled')
          .eq('key', 'require_waiting_list_approval')
          .single();
        const flag = flagData as FeatureFlagRow;
        if (flag?.enabled) {
          const { data: wlData } = await admin
            .from('waiting_list')
            .select('status')
            .eq('email', user.email.toLowerCase())
            .single();
          const wl = wlData as WaitingListRow;
          if (wl?.status !== 'approved') {
            return NextResponse.json({
              allowed: false,
              reason: 'not_approved',
              message: "You're on the list! We'll email you when you can sign in.",
            });
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin client table types not inferred in build
        await (admin as any).from('profiles').update({
          access_status: flag?.enabled ? 'trial' : 'customer',
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
      }
      return NextResponse.json({ allowed: true });
    }

    // No profile (e.g. created before trigger): check waiting list and create profile
    const { data: flagData } = await admin
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'require_waiting_list_approval')
      .single();
    const flag = flagData as FeatureFlagRow;

    if (flag?.enabled) {
      const { data: wlData } = await admin
        .from('waiting_list')
        .select('status')
        .eq('email', user.email.toLowerCase())
        .single();
      const wl = wlData as WaitingListRow;
      if (wl?.status !== 'approved') {
        return NextResponse.json({
          allowed: false,
          reason: 'not_approved',
          message: "You're on the list! We'll email you when you can sign in.",
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin client table types not inferred in build
    await (admin as any).from('profiles').insert({
      id: user.id,
      role: 'parent',
      display_name: user.email.split('@')[0],
      access_status: flag?.enabled ? 'trial' : 'customer',
    });

    return NextResponse.json({ allowed: true });
  } catch (err) {
    console.error('[post-login-check]', err);
    return NextResponse.json(
      { allowed: false, reason: 'error' },
      { status: 500 }
    );
  }
}
