// supabaseServer.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase' // Nếu có types, còn không có thì xóa dòng này
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Hàm tạo Supabase cho Server Component (chuẩn Next.js 13+)
export function createServerSupabase() {
  return createServerComponentClient<Database>({ cookies })
  // Nếu không có types thì dùng:
  // return createServerComponentClient({ cookies })
}
