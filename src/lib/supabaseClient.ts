// src/lib/supabaseServer.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function createServerClient() {
  // 1) await trước khi dùng cookies()
  const cookieStore = await cookies();

  // 2) tạo Supabase client với cookieStore
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore,
  });

  return supabase;
}
