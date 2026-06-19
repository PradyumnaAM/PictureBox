import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/supabase'
import { getPublicSupabaseConfig } from './config'

/**
 * Supabase client for use in Client Components (browser).
 *
 * Safe to import in 'use client' components. Uses the public anon key,
 * so every query is subject to Row Level Security.
 */
export function createClient() {
  const { url, anonKey } = getPublicSupabaseConfig()
  return createBrowserClient<Database>(url, anonKey)
}
