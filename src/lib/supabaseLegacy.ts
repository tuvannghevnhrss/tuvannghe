// src/lib/supabase-server.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** 
 * Hàm này tạo Supabase client phía Server (Next.js RSC & API Route).
 * Nếu bạn đã dùng @supabase/auth-helpers-nextjs, giữ nguyên — chỉ thêm hàm
 *   createClient() cho đúng đường dẫn import.
 */

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // hoặc ANON KEY nếu chỉ READ
  );
}
