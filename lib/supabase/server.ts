import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for use in Server Components,
 * Server Actions, and Route Handlers.
 *
 * This client reads/writes auth cookies via next/headers.
 * It respects RLS policies because it uses the user's
 * JWT (anon key + user session).
 *
 * Usage in a Server Component:
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('bots').select()
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can throw in Server Components that are read-only.
            // The session will still be refreshed by the middleware.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client that bypasses RLS.
 * ONLY use in trusted server-side contexts (Route Handlers, Server Actions).
 * NEVER expose to the client side.
 *
 * Usage:
 *   const supabase = createAdminClient()
 *   const { data } = await supabase.from('users').select()
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Admin client is unavailable.');
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client does not manage user session cookies
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}
