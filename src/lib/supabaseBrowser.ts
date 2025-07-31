// src/lib/supabaseBrowser.ts
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types_db'

export const supabaseBrowser = createBrowserSupabaseClient<Database>()

export default supabaseBrowser           // ⬅ giữ default export để không gãy code cũ
