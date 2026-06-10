import { type NextRequest, NextResponse } from 'next/server'
import { getTVSeason } from '@/lib/tmdb/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ showId: string; seasonNumber: string }> },
) {
  const { showId, seasonNumber } = await params

  try {
    const season = await getTVSeason(parseInt(showId), parseInt(seasonNumber))
    return NextResponse.json(season, {
      headers: { 'Cache-Control': `s-maxage=43200, stale-while-revalidate` },
    })
  } catch {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 })
  }
}
