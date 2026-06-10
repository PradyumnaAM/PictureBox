import { NextRequest, NextResponse } from 'next/server'
import { searchMulti } from '@/lib/tmdb/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? ''

  if (!query.trim()) {
    return NextResponse.json({ movies: [], tvShows: [] })
  }

  try {
    const results = await searchMulti(query)

    const filtered = results.filter(
      (r) => r.media_type !== 'person' && r.poster_path,
    )

    const movies = filtered.filter((r) => r.media_type === 'movie').slice(0, 5)
    const tvShows = filtered.filter((r) => r.media_type === 'tv').slice(0, 5)

    return NextResponse.json({ movies, tvShows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ movies: [], tvShows: [] }, { status: 500 })
  }
}
