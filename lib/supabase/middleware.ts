import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * updateSession — refreshes the Supabase auth session on every request.
 *
 * This must be called from middleware.ts to ensure the user's JWT is
 * refreshed before it expires, preventing unexpected logouts.
 *
 * It reads the session cookie, silently refreshes it if needed,
 * and writes the updated cookie back to both the request and response
 * so downstream server components always see a valid session.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to the outgoing request (so server components see them)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Re-create the response with updated request cookies
          supabaseResponse = NextResponse.next({ request });

          // Write cookies to the outgoing response (so the browser persists them)
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Do not add any logic between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.
  await supabase.auth.getUser();

  return supabaseResponse;
}
