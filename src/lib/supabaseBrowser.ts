import { createBrowserClient } from '@supabase/ssr';

/**
 * Singleton browser‑side Supabase client.
 * ⚠️  Uses the *anon* key – NEVER put the service‑role key on the client!  
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Back‑compat aliases so các file cũ vẫn chạy
export const supabaseBrowser = createSupabaseBrowserClient;
export default createSupabaseBrowserClient;