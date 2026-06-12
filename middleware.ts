import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

/**
 * Routes that require authentication.
 * Any path that starts with these prefixes will be protected.
 */
const PROTECTED_PREFIXES = ['/dashboard'];

/**
 * Routes that should redirect authenticated users away
 * (e.g., auth pages when already logged in).
 */
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * Routes that are always public (no redirect logic).
 */
const PUBLIC_PREFIXES = ['/api/chat', '/embed', '/_next', '/favicon', '/public'];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public/static routes entirely
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Run Supabase session refresh on every request
  const response = await updateSession(request);

  // Read the refreshed session cookie to determine auth state
  let isAuthenticated = false;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    isAuthenticated = !!user;
  } catch {
    isAuthenticated = false;
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname) && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard';
    // Prevent open redirects — only allow relative paths
    const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Files with extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)).*)',
  ],
};
