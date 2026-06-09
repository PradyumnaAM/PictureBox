import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

/**
 * ⚠️ SERVER-ONLY ADMIN CLIENT — NEVER IMPORT THIS IN A CLIENT COMPONENT ⚠️
 *
 * This client is created with the SUPABASE_SERVICE_ROLE_KEY, which BYPASSES
 * Row Level Security entirely and has full read/write access to every table.
 *
 * The `import 'server-only'` above will throw a build-time error if this file
 * is ever pulled into a client bundle. Do not remove it.
 *
 * Only use for trusted, server-side operations that legitimately need to skip
 * RLS — e.g. account deletion, cron jobs, webhooks, and admin tooling.
 * Always run inside Route Handlers, Server Actions, or background jobs that
 * have already authorized the caller.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
