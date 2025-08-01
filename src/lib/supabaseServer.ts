// src/lib/supabaseServer.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* ---------------------------------------------------------
 *  Hàm chuẩn dùng trong Server Component / Route-handler
 * -------------------------------------------------------- */
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // dùng khóa server-side

  if (!url || !key) throw new Error("Missing Supabase env vars");

  const cookieStore = cookies();

  return createServerClient(url, key, {
    cookies: {
      // trả về **string** hoặc undefined
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // ghi cookie
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      // xoá cookie
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}

/* Giữ alias tương thích code cũ */
export const createSupabaseRouteServerClient = createSupabaseServerClient;
