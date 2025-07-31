'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Browser-side singleton Supabase client
 * (tương đương createBrowserClient của @supabase/ssr)
 */
export const createSupabaseBrowserClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: true, autoRefreshToken: true }
    }
  );

// --- alias để code cũ vẫn chạy ---
export { createSupabaseBrowserClient as supabaseBrowser };
export default createSupabaseBrowserClient;
