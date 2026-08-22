// src/lib/supabase/client.ts
// Dùng @supabase/ssr để đọc được chunked cookie (token Google lớn bị split)
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
