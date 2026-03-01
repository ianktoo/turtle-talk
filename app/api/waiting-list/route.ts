/**
 * POST /api/waiting-list
 * Public: add email to waiting list (status: pending). No auth required.
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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { error: 'Waiting list is not configured' },
        { status: 503 }
      );
    }

    const supabase = createClient(url, key);
    const { error } = await supabase.from('waiting_list').insert({ email, status: 'pending' });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, message: "You're already on the list!" });
      }
      console.error('[waiting-list]', error);
      return NextResponse.json(
        { error: 'Could not add you to the list' },
        { status: 500 }
      );
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
