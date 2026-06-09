import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// ─── In-memory rate limiter ──────────────────────────────────────────────────
// Works per-process (adequate for single-instance / dev). On multi-instance
// serverless the limit is per-instance, which is still a meaningful brake.
const rl = new Map<string, { count: number; resetAt: number }>()
const RL_MAX = 10
const RL_WINDOW_MS = 60_000

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rl.get(ip)
  if (!entry || now > entry.resetAt) {
    rl.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS })
    return true
  }
  if (entry.count >= RL_MAX) return false
  entry.count++
  return true
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ip = getIP(req)
  if (!checkRateLimit(ip)) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ available: data === null })
}
