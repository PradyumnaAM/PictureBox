import { NextResponse } from 'next/server'
import { getTrending } from '@/lib/tmdb/client'

export async function GET() {
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
