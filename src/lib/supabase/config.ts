/**
 * Reads and normalizes the public Supabase connection config.
 *
 * These are NEXT_PUBLIC_* values, inlined at build time. Two common deployment
 * mistakes produce a malformed request URL ("Invalid path specified in request
 * URL"): a trailing slash on the URL (→ a double slash in the auth path) or
 * stray surrounding quotes/whitespace pasted into the host's env UI. We defend
 * against both, and fail loudly when the vars are missing entirely.
 */
export function getPublicSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/^["']|["']$/g, '') // strip accidental surrounding quotes
    .replace(/\/+$/, '') // strip trailing slash(es)

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(
    /^["']|["']$/g,
    '',
  )

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY must be set at build time. On Vercel, ' +
        'add them in Project Settings → Environment Variables and redeploy ' +
        '(NEXT_PUBLIC_* values are baked in at build time).',
    )
  }

  return { url, anonKey }
}
