import { cookies } from "next/headers";
import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

/* ================================================================
 * Route / Server Action – ANON key + Cookie người dùng
 * ================================================================ */
export function createSupabaseRouteServerClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anonKey) throw new Error("Missing Supabase env vars");

  const store = cookies();                    // Next.js 15 cookie store
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll().map(c => ({ name: c.name, value: c.value }));
      },
      /* Quan trọng: PHẢI có setAll() để Supabase ghi cookie auth */
      setAll(cs) {
        cs.forEach(({ name, value, options }) => {
          store.set({ name, value, ...options } as CookieOptions & { name: string; value: string });
        });
      },
    },
  });
}

/* ================================================================
 * Server-side (Service-Role)
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

/* Back-compat alias */
export const createSupabaseRouteClient = createSupabaseRouteServerClient;
