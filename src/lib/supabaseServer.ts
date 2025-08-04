// src/lib/supabaseServer.ts
import { cookies } from 'next/headers'
import {
  createRouteHandlerClient,
  createServerComponentClient,
  type SupabaseClient
} from '@supabase/auth-helpers-nextjs'

/**  
 *  Cho API Route & middleware  
 */
export const createSupabaseRouteServerClient = <
  Database = any
>(): SupabaseClient<Database> =>
  createRouteHandlerClient<Database>({ cookies })

/**
 *  Cho Server Component / React Server Action
 */
export const createSupabaseServerClient = <
  Database = any
>(): SupabaseClient<Database> =>
  createServerComponentClient<Database>({ cookies })
