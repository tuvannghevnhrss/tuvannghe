import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Server-component / Route-handler Supabase client
 * Giữ session qua cookie store của Next App Router.
 */
export const createSupabaseServerClient = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
        set: (key, value, options: CookieOptions) =>
          cookieStore.set({ name: key, value, ...options }),
        remove: (key, options) =>
          cookieStore.set({ name: key, value: '', ...options })
      }
    }
  );
};

// --- alias để code cũ vẫn chạy ---
export const createSupabaseRouteServerClient = createSupabaseServerClient;
export { createSupabaseServerClient as supabaseServer };
export default createSupabaseServerClient;
