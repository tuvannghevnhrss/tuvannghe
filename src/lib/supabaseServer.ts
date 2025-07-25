// -----------------------------------------------------------------------------
// src/lib/supabaseServer.ts
// -----------------------------------------------------------------------------
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  createRouteHandlerClient,         // API / route handlers (Edge-/Node-runtime)
  createServerComponentClient,      // Server Components (RSC)
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

//* -------------------------------------------------------------------------- */
//* 1. service-role client – CHỈ dùng ở API/cron/SSR (có key bí mật)          */
//* -------------------------------------------------------------------------- */
export function createSupabaseServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

//* -------------------------------------------------------------------------- */
//* 2. route-handler client – dùng trong ./app/api/**/route.ts                 */
//* -------------------------------------------------------------------------- */
export function createSupabaseRouteServerClient() {
  return createRouteHandlerClient<Database>({ cookies });
}

//* -------------------------------------------------------------------------- */
//* 3. RSC client – dùng trong Server Components (ví dụ page.tsx)              */
//* -------------------------------------------------------------------------- */
export function createSupabaseRSC() {
  return createServerComponentClient<Database>({ cookies });
}
