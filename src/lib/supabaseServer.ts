// src/lib/supabaseServer.ts
import { cookies } from 'next/headers'
import {
  createServerSupabaseClient,
  type SupabaseClient,
} from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types_db'

export function supabaseServer(): SupabaseClient<Database> {
  // auth-helpers tự lo cookies, chỉ cần truyền context
  return createServerSupabaseClient<Database>({ cookies })
}

export default supabaseServer
// ✱ Nếu muốn hàm khởi tạo cho route handler (để dùng trong “/api/…/route.ts”)
export const createSupabaseRouteServerClient = supabaseServer
export const createSupabaseServerClient      = supabaseServer
