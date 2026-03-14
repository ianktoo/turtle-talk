/**
 * POST /api/waiting-list
 * Public: add email to waiting list (status: pending). No auth required.
 * Optionally links to a demo session via demoId.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const demoId = typeof body.demoId === 'string' ? body.demoId.trim() : null;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) {
      return NextResponse.json(
        { error: 'Waiting list is not configured' },
        { status: 503 }
      );
    }

    const supabase = createClient(url, anonKey);
    const { error } = await supabase.from('waiting_list').insert({ email, status: 'pending' });

    if (error) {
      if (error.code === '23505') {
        if (demoId) {
          await linkDemoToWaitlist(url, email, demoId);
        }
        return NextResponse.json({ ok: true, message: "You're already on the list!" });
      }
      console.error('[waiting-list]', error);
      return NextResponse.json(
        { error: 'Could not add you to the list' },
        { status: 500 }
      );
    }

    if (demoId) {
      await linkDemoToWaitlist(url, email, demoId);
    }

    return NextResponse.json({ ok: true, message: "You're on the list! We'll be in touch." });
  } catch (err) {
    console.error('[waiting-list]', err);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

async function linkDemoToWaitlist(url: string, email: string, demoId: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return;
  try {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await admin
      .from('waiting_list')
      .update({ demo_id: demoId })
      .eq('email', email);
  } catch {
    // Non-critical: linking fails silently so the waitlist signup still succeeds
  }
}
