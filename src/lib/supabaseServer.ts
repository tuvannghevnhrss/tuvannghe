import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* ------------------------------------------------------------------
 *  Hàm chuẩn dùng trong Server Component / Route-handler
 * ------------------------------------------------------------------ */
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // **server-side key**

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  /* Cookie helpers – Next.js 15 pages-router */
  const getAll = () =>
    cookies()
      .getAll()
      .map((c) => ({ name: c.name, value: c.value }));

  const setAll = (name: string, value: string, options: any) =>
    cookies().set({ name, value, ...options });

  return createServerClient(url, key, {
    cookies: { getAll, setAll },
  });
}

/* ------------------------------------------------------------------
 *  Alias để giữ tương thích file cũ (analyse / profile / …)
 * ------------------------------------------------------------------ */
export const createSupabaseRouteServerClient = createSupabaseServerClient;
/* hoặc:
export {
  createSupabaseServerClient as createSupabaseRouteServerClient
};
*/
