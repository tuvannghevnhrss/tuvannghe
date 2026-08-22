import { createClient } from "@supabase/supabase-js";

/** Service-role client — chỉ dùng trong route handler, sau khi đã xác thực admin. */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Client anon key, không đụng tới cookies()/headers() — dùng cho các trang
 * đọc dữ liệu công khai (vd. danh sách tin tuyển dụng đã published) muốn
 * cache/ISR (`export const revalidate = N`). Gọi cookies() trong Server
 * Component sẽ tự động ép Next.js render dynamic mọi request, bỏ qua revalidate.
 */
export function createSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
