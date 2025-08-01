// src/lib/supabaseRoute.ts
import { createClient } from "@supabase/supabase-js";

export function createRouteClient() {
  // fallback sang biến NEXT_PUBLIC_ nếu chưa có biến server
  const url  = process.env.SUPABASE_URL        ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, anon, { auth: { persistSession: false } });
}
