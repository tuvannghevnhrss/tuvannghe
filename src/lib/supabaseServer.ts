import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function createSupabaseServerClient () {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export function createSupabaseRouteServerClient (cookies:any) {
  /* nếu thích dùng auth-helpers để tự gắn cookie */
  const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
  return createRouteHandlerClient<Database>({ cookies });
}
