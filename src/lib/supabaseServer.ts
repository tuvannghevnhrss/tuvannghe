import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* ---------- Tạo Supabase client dùng trong Server Component / Route ---------- */
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // KHÓA server-side
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const store = cookies(); // helper Next 15

  return createServerClient(url, key, {
    cookies: {
      get(name) {
        return store.get(name)?.value; // phải trả về string | undefined
      },
      set(name, value, options) {
        store.set({ name, value, ...options });
      },
      remove(name, options) {
        store.set({ name, value: "", ...options });
      },
    },
  });
}

/* Giữ alias cũ nếu code nơi khác còn gọi */
export const createSupabaseRouteServerClient = createSupabaseServerClient;
