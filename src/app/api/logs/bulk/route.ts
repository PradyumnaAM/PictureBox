import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTVShow } from '@/lib/tmdb/client'
import type { Database } from '@/types/supabase'

type AdminClient = ReturnType<typeof createAdminClient>
type EpisodeInsert = Database['public']['Tables']['episodes']['Insert']
type UserLogUpdate = Database['public']['Tables']['user_logs']['Update']
type UserLogInsert = Database['public']['Tables']['user_logs']['Insert']

interface BulkEpisode {
  episode_id: number   // TMDB episode ID
  episode_number: number
  runtime?: number | null
}

interface BulkBody {
  log_type: 'tv_episodes_bulk'
  status: 'watched' | 'unwatched'
  tmdb_show_id: number
  season_number: number
  episodes: BulkEpisode[]
  show_name?: string
}

// ─── Shared helper: resolve the title UUID without ever writing a blank name ───
// Never creates or overwrites the parent title row with an empty/whitespace
// title. An existing row is reused as-is; a missing row is created using the
// real show name (from the payload when present, otherwise fetched from TMDB).
async function resolveTvTitleId(
  admin: AdminClient,
  tmdbShowId: number,
  showName?: string,
): Promise<string | null> {
  const { data: existing } = await admin
    .from('titles')
    .select('id')
    .eq('tmdb_id', tmdbShowId)
    .eq('media_type', 'tv')
    .maybeSingle()

  if (existing) return (existing as { id: string }).id

  let title = (showName ?? '').trim()
  if (!title) {
    try {
      const show = await getTVShow(tmdbShowId)
      title = (show.name ?? '').trim()
    } catch (err) {
      console.error('[logs/bulk] TMDB title lookup failed:', err)
    }
  }

  if (!title) return null

  const { data: inserted, error } = await admin
    .from('titles')
    .upsert(
      { tmdb_id: tmdbShowId, media_type: 'tv', title },
      { onConflict: 'tmdb_id,media_type' },
    )
    .select('id')
    .single()

  if (error || !inserted) {
    const { data: raced } = await admin
      .from('titles')
      .select('id')
      .eq('tmdb_id', tmdbShowId)
      .eq('media_type', 'tv')
      .maybeSingle()
    return (raced as { id: string } | null)?.id ?? null
  }

  return (inserted as { id: string }).id
}

// ─── POST /api/logs/bulk ──────────────────────────────────────────────────────
// Mark all episodes in a season as watched or unwatched in one request.

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
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
    body.episodes.length > 100 ||
    (body.status !== 'watched' && body.status !== 'unwatched')
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (body.status === 'watched') {
    return handleMarkWatched(admin, user.id, body)
  } else {
    return handleMarkUnwatched(admin, user.id, body)
  }
}

async function handleMarkWatched(
  admin: AdminClient,
  userId: string,
  body: BulkBody,
) {
  const today = new Date().toISOString().split('T')[0]

  // ── 1. Resolve title UUID (never writes a blank title) ───────────────────
  const titleId = await resolveTvTitleId(admin, body.tmdb_show_id, body.show_name)
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
      // Persist runtime when provided (positive only) so it feeds total-hours.
      const episodeRecord: EpisodeInsert = {
        season_id: seasonId,
        episode_number: ep.episode_number,
        tmdb_episode_id: ep.episode_id,
      }
      if (typeof ep.runtime === 'number' && ep.runtime > 0) {
        episodeRecord.runtime = ep.runtime
      }

      const { data: episodeRow, error: episodeError } = await admin
        .from('episodes')
        .upsert(episodeRecord, { onConflict: 'season_id,episode_number' })
        .select('id')
        .single()

      if (episodeError || !episodeRow) {
        console.error('[logs/bulk] episode upsert error:', episodeError)
        return
      }

      const episodeId: string = (episodeRow as { id: string }).id

      // Revive-or-insert: a prior unwatch soft-deletes the row. A plain upsert
      // would conflict on the unique key but leave deleted_at set, keeping the
      // episode hidden. Update any existing row (clearing deleted_at) or insert.
      const { data: existingLog } = await admin
        .from('user_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('title_id', titleId)
        .eq('log_type', 'tv_episode')
        .eq('season_id', seasonId)
        .eq('episode_id', episodeId)
        .maybeSingle()

      if (existingLog) {
        await admin
          .from('user_logs')
          .update({ status: 'watched', watched_at: today, deleted_at: null })
          .eq('id', (existingLog as { id: string }).id)
      } else {
        await admin.from('user_logs').insert({
          user_id: userId,
          title_id: titleId,
          log_type: 'tv_episode',
          status: 'watched',
          watched_at: today,
          season_id: seasonId,
          episode_id: episodeId,
        })
      }
    }),
  )

  return NextResponse.json({ success: true })
}

async function handleMarkUnwatched(
  admin: AdminClient,
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
