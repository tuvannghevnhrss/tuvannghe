// src/lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/* -------------------------------------------------- */
/* 1)  Client cho browser – dùng trong component "use client" */
export function createBrowserClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* -------------------------------------------------- */
/* 2)  Client cho server-side (Route Handler / RSC)    */
/*     – gắn cookie để giữ phiên đăng nhập            */
export function createServerSupabase() {
  return createServerComponentClient<Database>({ cookies });
}

/* -------------------------------------------------- */
/* 3)  Client toàn quyền (SERVICE ROLE) – chỉ dùng    */
/*     trong API Route nội bộ, KHÔNG dùng client-side */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // key có quyền insert/update ...
  );
}
