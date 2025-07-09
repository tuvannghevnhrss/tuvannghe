/**
 * Client Supabase dùng cho cả Server Components & Client Components.
 *  – Export const `supabase`  (named)
 *  – Export mặc định               (default)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);

export default supabase;