import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface BulkEpisode {
  episode_id: number   // TMDB episode ID
  episode_number: number
}

interface BulkBody {
  log_type: 'tv_episodes_bulk'
  status: 'watched' | 'unwatched'
  tmdb_show_id: number
  season_number: number
  episodes: BulkEpisode[]
}

// ─── POST /api/logs/bulk ──────────────────────────────────────────────────────
// Mark all episodes in a season as watched or unwatched in one request.

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: BulkBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    !body.tmdb_show_id ||
    !body.season_number ||
    !Array.isArray(body.episodes) ||
    body.episodes.length === 0 ||
    (body.status !== 'watched' && body.status !== 'unwatched')
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  if (body.status === 'watched') {
    return handleMarkWatched(admin, session.user.id, body)
  } else {
    return handleMarkUnwatched(admin, session.user.id, body)
  }
}

async function handleMarkWatched(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  body: BulkBody,
) {
  const today = new Date().toISOString().split('T')[0]

  // ── 1. Resolve title UUID ────────────────────────────────────────────────
  let titleId: string | null = null
  const { data: titleUpsert, error: titleUpsertError } = await admin
    .from('titles')
    .upsert(
      { tmdb_id: body.tmdb_show_id, media_type: 'tv', title: '' },
      { onConflict: 'tmdb_id,media_type' },
    )
    .select('id')
    .single()

  if (!titleUpsertError && titleUpsert) {
    titleId = (titleUpsert as { id: string }).id
  } else {
    const { data: existing } = await admin
      .from('titles')
      .select('id')
      .eq('tmdb_id', body.tmdb_show_id)
      .eq('media_type', 'tv')
      .single()
    titleId = (existing as { id: string } | null)?.id ?? null
  }

  if (!titleId) {
    return NextResponse.json({ error: 'Failed to resolve title' }, { status: 500 })
  }

  // ── 2. Resolve season UUID ───────────────────────────────────────────────
  const { data: seasonRow, error: seasonError } = await admin
    .from('seasons')
    .upsert(
      { title_id: titleId, season_number: body.season_number },
      { onConflict: 'title_id,season_number' },
    )
    .select('id')
    .single()

  if (seasonError || !seasonRow) {
    console.error('[logs/bulk] season upsert error:', seasonError)
    return NextResponse.json({ error: 'Failed to resolve season' }, { status: 500 })
  }

  const seasonId: string = (seasonRow as { id: string }).id

  // ── 3. For each episode: resolve UUID then upsert log ───────────────────
  await Promise.all(
    body.episodes.map(async (ep) => {
      const { data: episodeRow, error: episodeError } = await admin
        .from('episodes')
        .upsert(
          {
            season_id: seasonId,
            episode_number: ep.episode_number,
            tmdb_episode_id: ep.episode_id,
          },
          { onConflict: 'season_id,episode_number' },
        )
        .select('id')
        .single()

      if (episodeError || !episodeRow) {
        console.error('[logs/bulk] episode upsert error:', episodeError)
        return
      }

      const episodeId: string = (episodeRow as { id: string }).id

      await admin
        .from('user_logs')
        .upsert(
          {
            user_id: userId,
            title_id: titleId,
            log_type: 'tv_episode',
            status: 'watched',
            watched_at: today,
            season_id: seasonId,
            episode_id: episodeId,
          },
          { onConflict: 'user_id,title_id,season_id,episode_id,rewatch_count' },
        )
    }),
  )

  return NextResponse.json({ success: true })
}

async function handleMarkUnwatched(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  body: BulkBody,
) {
  // ── 1. Find title UUID ───────────────────────────────────────────────────
  const { data: titleRow } = await admin
    .from('titles')
    .select('id')
    .eq('tmdb_id', body.tmdb_show_id)
    .eq('media_type', 'tv')
    .single()

  if (!titleRow) return NextResponse.json({ success: true })
  const titleId: string = (titleRow as { id: string }).id

  // ── 2. Find season UUID ──────────────────────────────────────────────────
  const { data: seasonRow } = await admin
    .from('seasons')
    .select('id')
    .eq('title_id', titleId)
    .eq('season_number', body.season_number)
    .single()

  if (!seasonRow) return NextResponse.json({ success: true })
  const seasonId: string = (seasonRow as { id: string }).id

  // ── 3. Collect episode UUIDs then soft-delete all logs at once ───────────
  const episodeRows = await Promise.all(
    body.episodes.map(async (ep) => {
      const { data } = await admin
        .from('episodes')
        .select('id')
        .eq('season_id', seasonId)
        .eq('episode_number', ep.episode_number)
        .single()
      return (data as { id: string } | null)?.id ?? null
    }),
  )

  const episodeIds = episodeRows.filter((id): id is string => id !== null)
  if (episodeIds.length === 0) return NextResponse.json({ success: true })

  const { error } = await admin
    .from('user_logs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('title_id', titleId)
    .eq('log_type', 'tv_episode')
    .eq('season_id', seasonId)
    .in('episode_id', episodeIds)
    .is('deleted_at', null)

  if (error) {
    console.error('[logs/bulk] delete error:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to remove logs' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
