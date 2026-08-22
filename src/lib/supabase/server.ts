import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function makeClient() {
  return async () => {
    const cookieStore = await cookies()
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Components cannot set cookies — safe to ignore
            }
          },
        },
      }
    )
  }
}

/** Dùng trong Server Components (app/*) */
export const createSupabaseServerClient = makeClient()

/** Dùng trong Route Handlers (app/api/.../route.ts) & Server Actions */
export const createSupabaseRouteServerClient = makeClient()
