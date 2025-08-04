import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/* ▸ Dùng cho API/route cần session người dùng (Key ANON + Cookies) */
export function createSupabaseRouteServerClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anonKey) {
    console.error("❌ Missing Supabase env vars", { url: !!url, anonKey: !!anonKey });
    throw new Error("Missing Supabase env vars");
  }

  /* API v0.6 – cần getAll + set  */
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () =>
        cookies().getAll().map(c => ({ name: c.name, value: c.value })),
      set: (name, value, options) =>
        cookies().set({ name, value, ...options }),
    },
  });
}

/* ▸ Hàm server-side (Service-Role) bạn đã có – giữ nguyên */
export function createSupabaseServerClient() { … }
