import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for use in Client Components.
 * Uses @supabase/ssr's createBrowserClient which handles
 * cookie-based auth automatically in the browser.
 *
 * Usage in a Client Component:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('bots').select()
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton browser client for convenience in hooks/utilities
 * that are always called in a browser context.
 */
let _browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error(
      'getBrowserClient() must only be called in a browser (client) context. ' +
        'Use getServerClient() from lib/supabase/server.ts for server components.'
    );
  }
  if (!_browserClient) {
    _browserClient = createClient();
  }
  return _browserClient;
}
