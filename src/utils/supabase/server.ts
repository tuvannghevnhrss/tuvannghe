/*  Supabase client (server-side) – Next 15  */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * ⚠️  MUST be called **before** any async/await in the same request
 *      để tuân thủ quy tắc “sync dynamic API” của Next 15.
 */
export const createClient = async () => {
  /* 1️⃣  Lấy cookieStore NGAY LẬP TỨC và nhớ thêm await  */
  const cookieStore = await cookies();

  /* 2️⃣  Trả về Supabase client với hàm get/set/remove
         KHÔNG gọi lại cookies() lần nào nữa  */
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:  (key: string) => cookieStore.get(key)?.value,
        set:  (key: string, value: string, options: CookieOptions) =>
          cookieStore.set({ name: key, value, ...options }),
        remove: (key: string, options: CookieOptions) =>
          cookieStore.delete({ name: key, ...options }),
      },
    }
  );
};
