import { cookies } from "next/headers";
import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

/* ----------------------------------------------------------
 * 1) API / Route Handler – dùng Anon Key + Cookie người dùng
 * -------------------------------------------------------- */
export function createSupabaseRouteServerClient() {
  const url      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anonKey) throw new Error("Missing Supabase env vars");

  const store = cookies();                           // Next 15 cookie store
  return createServerClient(url, anonKey, {
    cookies: {
      /* đọc **tất cả** cookie kèm request */
      getAll() {
        return store.getAll().map(c => ({ name: c.name, value: c.value }));
      },
      /* ghi **nguyên xi** cookie Supabase muốn set  */
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          store.set({ name, value, ...options } as CookieOptions & { name: string; value: string });
        });
      },
    },
  });
}

/* ----------------------------------------------------------
 * 2) Server Component / Cron – dùng Service-Role
 * -------------------------------------------------------- */
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

/* alias cũ nếu mã khác vẫn import */
export const createSupabaseRouteClient = createSupabaseRouteServerClient;
