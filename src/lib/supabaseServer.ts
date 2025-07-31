import { cookies, headers } from 'next/headers';
import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client dùng trong Server Component / Route Handler.
 * Không thao tác cookie trực tiếp – dùng API của Next 13 +
 */
export function createSupabaseServerClient() {
  const store = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    headers: { authorization: headers().get('authorization') ?? '' },

    cookies: {
      get:    (name)             => store.get(name)?.value,
      set:    (name, value, opt) => store.set({ name, value, ...opt }),
      remove: (name,      opt)   => store.delete(name,        opt),
    },
  });
}

/* Giữ nguyên các tên export cũ để code khác không đổi */
export const createSupabaseRouteServerClient = createSupabaseServerClient;
export { createSupabaseServerClient as createSupabaseServerClientLegacy };
export default createSupabaseServerClient;
