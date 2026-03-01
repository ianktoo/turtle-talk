/**
 * GET /api/child-session
 * Returns current child session from cookie (if valid). Used by client to get childId for useMissions/usePersonalMemory.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getChildSessionCookieName, parseChildSessionCookieValue } from '@/lib/child-session';

export async function GET(request: NextRequest) {
  try {
    const cookieValue = request.cookies.get(getChildSessionCookieName())?.value;
    const session = parseChildSessionCookieValue(cookieValue);
    if (!session) {
      return NextResponse.json({ child: null }, { status: 200 });
    }
    return NextResponse.json({
      child: {
        childId: session.childId,
        firstName: session.firstName,
        emoji: session.emoji,
      },
    });
  } catch {
    return NextResponse.json({ child: null }, { status: 200 });
  }
}
