import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Server‑side Supabase client.  
 *   – Đọc / ghi cookie phiên đăng nhập an toàn.  
 *   – Trả về 1 client mới cho mỗi request.
 */
export function createSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies, headers }
  );
}

// Giữ alias cũ để không breaking các module khác
export const supabaseServer       = createSupabaseServerClient;
export const createServerClient   = createSupabaseServerClient;
export const createSupabaseRouteServerClient = createSupabaseServerClient;
export default createSupabaseServerClient;