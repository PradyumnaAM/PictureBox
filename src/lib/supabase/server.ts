import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/supabase'
import { getPublicSupabaseConfig } from './config'

/**
 * Supabase client for use in Server Components, Server Actions, and
 * Route Handlers.
 *
 * Reads/writes the session from Next.js cookies. Uses the public anon key,
 * so every query is subject to Row Level Security. Create a fresh client per
 * request — do not cache this across requests.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getPublicSupabaseConfig()

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions (see src/middleware.ts).
          }
        },
      },
    }
  )
}
