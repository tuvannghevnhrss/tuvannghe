//* -------------------------------------------------------------------------- */
//*  SUPABASE HELPERS – DÙNG TRONG SERVER COMPONENT & ROUTE HANDLER            */
//* -------------------------------------------------------------------------- */
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

//** Service-role client – đọc/ghi được tất cả bảng. KHÔNG dùng cho browser */
export function createSupabaseServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

//** Anon client – dùng trong Server Components (SSR) nếu chỉ cần quyền public */
export function createSupabaseAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

//** Route-handler client – tự lấy token từ cookie, giúp xác định user đang login */
export function createSupabaseRouteServerClient() {
  return createRouteHandlerClient<Database>({ cookies });
}
