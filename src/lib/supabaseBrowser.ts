import { createBrowserClient } from "@supabase/ssr";

/* Singleton client cho trình duyệt */
let _client:
  | ReturnType<typeof createBrowserClient>
  | undefined;

export function supabaseBrowser() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}

export default supabaseBrowser;
