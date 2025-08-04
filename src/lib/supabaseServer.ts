import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/* Route / API – cần ANON key + Cookie */
export function createSupabaseRouteServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Missing Supabase env vars");

  const store = cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll().map(c => ({ name: c.name, value: c.value })),
      setAll: cs =>
        cs.forEach(({ name, value, options }) =>
          store.set({ name, value, ...options } as CookieOptions & { name: string; value: string })
        ),
    },
  });
}

/* Service-Role client cho Server Component */
export function createSupabaseServerClient() { /* … giống hiện tại … */ }

/* Export browser client nếu cần */
export { supabaseBrowser } from "@/lib/supabaseBrowser";
