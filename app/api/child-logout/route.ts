/**
 * POST /api/child-logout
 * Clears the child session cookie.
 */
import { NextResponse } from 'next/server';
import { getChildSessionCookieName } from '@/lib/child-session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getChildSessionCookieName(), '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
