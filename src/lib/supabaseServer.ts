// src/lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';   // <-- nếu bạn có types; nếu không, bỏ dòng này

/**
 * Trả về 1 Supabase **service role** client dùng trong API route
 * (Node.js – KHÔNG dùng ở client vì có key bí mật).
 */
export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, serviceKey);
}

/**
 * Nếu cần một client “public” cho server components → dùng hàm này.
 */
export function createSupabaseAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(supabaseUrl, anonKey);
}
