import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-side key
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const store = cookies(); // Next 15 helpers

  return createServerClient(url, key, {
    cookies: {
      /* lấy 1 cookie; phải trả về string | undefined */
      get(name) {
        return store.get(name)?.value;
      },
      /* đặt cookie */
      set(name, value, options) {
        store.set({ name, value, ...options });
      },
      /* xoá cookie */
      remove(name, options) {
        store.set({ name, value: "", ...options });
      },
    },
  });
}

/* alias cho code cũ (tuỳ chọn) */
export const createSupabaseRouteServerClient = createSupabaseServerClient;
