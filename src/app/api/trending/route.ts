import { type NextRequest, NextResponse } from 'next/server'
import { getTrending } from '@/lib/tmdb/client'
import { createRateLimiter, getIP } from '@/lib/rate-limit'

const rl = createRateLimiter({ max: 60, windowMs: 60_000 })

export async function GET(request: NextRequest) {
  if (!rl(getIP(request))) {
    return NextResponse.json([], { status: 429 })
  }

  try {
    const results = await getTrending('all', 'day')
    const filtered = results
      .filter((r) => r.media_type !== 'person' && r.poster_path)
      .slice(0, 6)
    return NextResponse.json(filtered)
  } catch {
    return NextResponse.json([])
  }
}
