/**
 * Refreshes Supabase auth session and optionally protects /parent and /admin.
 * Use in Next.js middleware (middleware.ts).
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session; required so server and browser stay in sync
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Protect /parent and /admin: require auth, redirect to login
  const pathname = request.nextUrl.pathname;
  const protectedPaths = ['/parent', '/admin'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/auth');

  if (isProtected && !user && !isAuthRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
