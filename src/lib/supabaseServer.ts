import { cookies } from "next/headers";
import {
  createServerClient,
  createBrowserClient,   // tiện tạo alias export luôn
  type CookieOptions,
} from "@supabase/ssr";

/* ================================================================
 * 1) Client cho API Route / Server Action — dùng ANON key + Cookie
 * ================================================================ */
export function createSupabaseRouteServerClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anonKey) throw new Error("Missing Supabase env vars");

  const store = cookies();                            // Next.js 15
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll().map(c => ({ name: c.name, value: c.value }));
      },
      setAll(cs) {
        cs.forEach(({ name, value, options }) => {
          store.set({ name, value, ...options } as CookieOptions & { name: string; value: string });
        });
      },
    },
  });
}

/* ================================================================
 * 2) Client Service-Role cho Server Component / Cron
 * ================================================================ */
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const store = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll().map(c => ({ name: c.name, value: c.value })),
      setAll: cs => cs.forEach(({ name, value, options }) =>
        store.set({ name, value, ...options } as CookieOptions & { name: string; value: string })
      ),
    },
  });
}

/* ================================================================
 * 3) Browser client — xuất ra dùng cho phía client
 * ================================================================ */
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* Giữ alias cũ (nếu code cũ import tên này) */
export const createSupabaseRouteClient = createSupabaseRouteServerClient;
