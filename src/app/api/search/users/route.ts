import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createRateLimiter, getIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const rl = createRateLimiter({ max: 60, windowMs: 60_000 })

export interface UserSearchResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export async function GET(request: NextRequest) {
  if (!rl(getIP(request))) {
    return NextResponse.json({ users: [] }, { status: 429 })
  }

  const raw = request.nextUrl.searchParams.get('q') ?? ''
  // Strip characters that have special meaning in PostgREST filters (commas,
  // parentheses, wildcards, backslashes) so user input can't alter the query.
  const q = raw.replace(/[,%()\\*]/g, '').trim()

  if (q.length < 2) {
    return NextResponse.json({ users: [] })
  }

  try {
    // RLS client: profiles_select exposes public profiles (plus self/followed),
    // which is the correct visibility for a people search.
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(8)

    if (error) {
      return NextResponse.json({ users: [] }, { status: 500 })
    }

    return NextResponse.json(
      { users: (data ?? []) as UserSearchResult[] },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json({ users: [] }, { status: 500 })
  }
}
