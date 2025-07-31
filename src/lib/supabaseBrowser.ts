// ❗️CHỈ dùng tại Client Component
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Singleton client cho toàn bộ FE */
export const supabaseBrowser = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
);

export default supabaseBrowser;          // Giữ nguyên default-export cũ
