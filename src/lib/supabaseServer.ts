// src/lib/supabaseServer.ts
//**
 //* Gói các hàm khởi tạo Supabase server-side để dùng cho:
// *   • Server Component (page, layout…)
// *   • Route Handler / API Route
// *   • Service-Role (tác vụ nền / CRON, ví dụ GPT phân tích profile)
// *   • Anon (nếu cần gọi Supabase public ở server)
// *
// * Lưu ý:
// *   - KHÔNG import bất kỳ hàm nào ở Client-side; tất cả chỉ dùng trong môi trường Node.
// *   - Biến môi trường đã nằm trong .env.local.
 

import { cookies } from 'next/headers';
import {
  createServerComponentClient,   // cho Server Component
  createRouteHandlerClient,      // cho Route Handler / API Route
} from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js'; // service-role & anon
import type { Database } from '@/types/supabase';     // nếu chưa có, xoá kiểu này

//* ------------------------------------------------------------------ */
//* 1. Server Component (page.tsx, layout.tsx…)                        */
//* ------------------------------------------------------------------ */
export function createSupabaseServerComponentClient() {
  return createServerComponentClient<Database>({ cookies });
}

//* ------------------------------------------------------------------ */
//* 2. Route Handler / API Route (src/app/api/**/route.ts)             */
//* ------------------------------------------------------------------ */
export function createSupabaseRouteServerClient() {
  return createRouteHandlerClient<Database>({ cookies });
}

//* ------------------------------------------------------------------ */
//* 3. Service-Role client (chỉ dùng ở Server, có quyền ghi)           */
//* ------------------------------------------------------------------ */
export function createSupabaseServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,   // KHÔNG bao giờ đưa key này ra client
  );
}

//* ------------------------------------------------------------------ */
//* 4. Anon client (public) – tuỳ dự án có cần hay không               */
//* ------------------------------------------------------------------ */
export function createSupabaseAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
