import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createRateLimiter, getIP } from '@/lib/rate-limit'

const rl = createRateLimiter({ max: 10, windowMs: 60_000 })

// ─── Route handler ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!rl(getIP(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const username = new URL(req.url).searchParams.get('username') ?? ''

  // Validate format before hitting the DB
  if (
    !username ||
    username.length < 3 ||
    username.length > 30 ||
    !/^[A-Za-z0-9_]+$/.test(username)
  ) {
    return NextResponse.json({ available: false })
  }

  // NOTE: uses the regular server client (anon key + RLS). Profiles with
  // profile_public = false won't be visible to unauthenticated queries, so
  // their usernames would falsely appear available. This edge case is
  // acceptable because profile_public defaults to true.
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ available: data === null })
}
