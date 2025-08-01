import { cookies, headers } from "next/headers";
import { type CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** ------------------------------------------------
 * Trả về Supabase client dùng trong Server-Side code
 * ------------------------------------------------*/
export function createSupabaseServerClient() {
  const cookieStore = cookies();                     // <- cookies() chứ KHÔNG phải cookies
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get:        (name: string)                    => cookieStore.get(name)?.value,
      getAll:     ()                               => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
      set:        (name: string, value: string, opts?: CookieOptions) =>
                    cookieStore.set({ name, value, ...opts }),
      delete:     (name: string, opts?: CookieOptions) =>
                    cookieStore.delete({ name, ...opts }),
    },
    headers:      () => headers(),                  // gửi nguyên header xuống edge
  });
}

/** Aliases để các file cũ không báo lỗi import */
export const createSupabaseRouteServerClient = createSupabaseServerClient;
export const createSupabaseLegacyClient     = createSupabaseServerClient; // tuỳ, nếu còn file cũ

/** Lấy user (dùng trong app/chat/page.tsx) */
export async function getUser() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("supabase.getUser:", error.message);
    return null;
  }
  return data.user;
}
