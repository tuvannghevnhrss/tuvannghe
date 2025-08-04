import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/* ---------------------------------------------------------------------------
 * 1) Dùng trong Route Handler / API – cần session người dùng (Anon key + Cookie)
 * ------------------------------------------------------------------------- */
export function createSupabaseRouteServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anonKey) {
    console.error("❌ Missing Supabase env vars", { url: !!url, anonKey: !!anonKey });
    throw new Error("Missing Supabase env vars");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookies().getAll().map(c => ({ name: c.name, value: c.value })),
      set:  (name, value, options) => cookies().set({ name, value, ...options }),
    },
  });
}

/* ---------------------------------------------------------------------------
 * 2) Dùng trong Server Component / Cron – quyền Service-Role
 * ------------------------------------------------------------------------- */
export function createSupabaseServerClient() {
  const url  = process.env.SUPABASE_URL!;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const store = cookies();   // helper Next.js 15

  return createServerClient(url, key, {
    cookies: {
      get:    (name)                 => store.get(name)?.value,            // string | undefined
      set:    (name, value, options) => store.set({ name, value, ...options }),
      remove: (name,        options) => store.set({ name, value: "", ...options }),
    },
  });
}

/* Giữ alias cũ nếu mã khác vẫn import tên này */
export const createSupabaseRouteClient = createSupabaseRouteServerClient;
