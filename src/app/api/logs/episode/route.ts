import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTVShow } from '@/lib/tmdb/client'

// ─── Shared helper: resolve the title UUID without ever writing a blank name ───
// Never creates or overwrites the parent title row with an empty/whitespace
// title. An existing row is reused as-is; a missing row is created using the
// real show name (from the payload when present, otherwise fetched from TMDB).
async function resolveTvTitleId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  tmdbShowId: number,
  showName?: string,
): Promise<string | null> {
  // 1. Reuse an existing row — do NOT touch its (possibly already-good) title.
  const { data: existing } = await admin
    .from('titles')
    .select('id')
    .eq('tmdb_id', tmdbShowId)
    .eq('media_type', 'tv')
    .maybeSingle()

  if (existing) return (existing as { id: string }).id

  // 2. Resolve a non-empty title before inserting.
  let title = (showName ?? '').trim()
  if (!title) {
    try {
      const show = await getTVShow(tmdbShowId)
      title = (show.name ?? '').trim()
    } catch (err) {
      console.error('[logs/episode] TMDB title lookup failed:', err)
    }
  }

  // Never insert a blank title.
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
    // Lost a race against a concurrent insert? Re-read the now-existing row.
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

// ─── GET /api/logs/episode?tmdbId=<id> ─────────────────────────────────────────
// Return the signed-in user's saved episode logs for a show (RLS-scoped).
// Shape: { logs: Array<{ season_number, episode_number, episode_tmdb_id,
//          watched: true, rating: number | null }> }

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tmdbIdParam = req.nextUrl.searchParams.get('tmdbId')
  const tmdbId = tmdbIdParam ? Number(tmdbIdParam) : NaN
  if (!tmdbId || Number.isNaN(tmdbId)) {
    return NextResponse.json({ error: 'Missing tmdbId' }, { status: 400 })
  }

  // titles are public-readable; the user-scoped (RLS) client is sufficient.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: titleRow } = await sb
    .from('titles')
    .select('id')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', 'tv')
    .maybeSingle()

  if (!titleRow) {
    return NextResponse.json({ logs: [] })
  }
  const titleId: string = (titleRow as { id: string }).id

  // The user's non-deleted episode logs, joined to season/episode numbers.
  const { data, error } = await sb
    .from('user_logs')
    .select(
      'rating, season:seasons(season_number), episode:episodes(episode_number, tmdb_episode_id)',
    )
    .eq('user_id', user.id)
    .eq('title_id', titleId)
    .eq('log_type', 'tv_episode')
    .is('deleted_at', null)

  if (error) {
    console.error('[logs/episode] GET error:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 })
  }

  const logs = ((data ?? []) as Array<{
    rating: number | null
    season: { season_number: number } | null
    episode: { episode_number: number; tmdb_episode_id: number | null } | null
  }>)
    .filter((row) => row.season && row.episode)
    .map((row) => ({
      season_number: row.season!.season_number,
      episode_number: row.episode!.episode_number,
      episode_tmdb_id: row.episode!.tmdb_episode_id ?? null,
      watched: true as const,
      rating: row.rating ?? null,
    }))

  return NextResponse.json({ logs })
}

// ─── POST /api/logs/episode ───────────────────────────────────────────────────
// Mark a specific episode as watched (and optionally set/clear a rating).

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    tmdb_show_id: number
    season_number: number
    episode_number: number
    episode_tmdb_id: number
    show_name?: string
    rating?: number | null
    runtime?: number | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.tmdb_show_id || !body.season_number || !body.episode_number || !body.episode_tmdb_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const today = new Date().toISOString().split('T')[0]

  // ── 1. Resolve title UUID (never writes a blank title) ─────────────────────
  const titleId = await resolveTvTitleId(admin, body.tmdb_show_id, body.show_name)
  if (!titleId) {
    return NextResponse.json({ error: 'Failed to resolve title' }, { status: 500 })
  }

  // ── 2. Resolve season UUID ─────────────────────────────────────────────────
  const { data: seasonRow, error: seasonError } = await admin
    .from('seasons')
    .upsert(
      { title_id: titleId, season_number: body.season_number },
      { onConflict: 'title_id,season_number' },
    )
    .select('id')
    .single()

  if (seasonError || !seasonRow) {
    console.error('[logs/episode] season upsert error:', seasonError)
    return NextResponse.json({ error: 'Failed to resolve season' }, { status: 500 })
  }

  const seasonId: string = (seasonRow as { id: string }).id

  // ── 3. Resolve episode UUID ────────────────────────────────────────────────
  // Persist the episode runtime when provided so total-hours stats can sum it.
  // Only set it for a positive number to avoid wiping a good value with null.
  const episodeRecord: Record<string, unknown> = {
    season_id: seasonId,
    episode_number: body.episode_number,
    tmdb_episode_id: body.episode_tmdb_id,
  }
  if (typeof body.runtime === 'number' && body.runtime > 0) {
    episodeRecord.runtime = body.runtime
  }

  const { data: episodeRow, error: episodeError } = await admin
    .from('episodes')
    .upsert(episodeRecord, { onConflict: 'season_id,episode_number' })
    .select('id')
    .single()

  if (episodeError || !episodeRow) {
    console.error('[logs/episode] episode upsert error:', episodeError)
    return NextResponse.json({ error: 'Failed to resolve episode' }, { status: 500 })
  }

  const episodeId: string = (episodeRow as { id: string }).id

  // ── 4. Revive-or-insert the watch log ──────────────────────────────────────
  // A previous unwatch soft-deletes the row (sets deleted_at). A plain upsert
  // would conflict on the unique key but leave deleted_at set, keeping the
  // episode hidden. So find any existing row (incl. soft-deleted) and update it
  // (clearing deleted_at); otherwise insert a fresh one. This makes the
  // watch/unwatch toggle idempotent and repeatable.
  const ratingProvided = typeof body.rating === 'number' || body.rating === null
  const ratingValue = ratingProvided ? body.rating ?? null : undefined

  const { data: existingLog } = await admin
    .from('user_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('title_id', titleId)
    .eq('log_type', 'tv_episode')
    .eq('season_id', seasonId)
    .eq('episode_id', episodeId)
    .maybeSingle()

  if (existingLog) {
    const update: Record<string, unknown> = {
      status: 'watched',
      watched_at: today,
      deleted_at: null,
    }
    if (ratingValue !== undefined) update.rating = ratingValue

    const { error: updateError } = await admin
      .from('user_logs')
      .update(update)
      .eq('id', (existingLog as { id: string }).id)

    if (updateError) {
      console.error('[logs/episode] log update error:', JSON.stringify(updateError, null, 2))
      return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
    }
  } else {
    const insert: Record<string, unknown> = {
      user_id: user.id,
      title_id: titleId,
      log_type: 'tv_episode',
      status: 'watched',
      watched_at: today,
      season_id: seasonId,
      episode_id: episodeId,
    }
    if (ratingValue !== undefined) insert.rating = ratingValue

    const { error: insertError } = await admin.from('user_logs').insert(insert)

    if (insertError) {
      console.error('[logs/episode] log insert error:', JSON.stringify(insertError, null, 2))
      return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

// ─── PATCH /api/logs/episode ──────────────────────────────────────────────────
// Persist an episode rating. Behaves like POST (revive-or-insert) so rating a
// previously-unrated or unwatched episode also marks it watched and survives
// reloads.

export async function PATCH(req: NextRequest) {
  return POST(req)
}

// ─── DELETE /api/logs/episode ─────────────────────────────────────────────────
// Soft-delete the episode watch log.

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    tmdb_show_id: number
    season_number: number
    episode_number: number
    episode_tmdb_id?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.tmdb_show_id || !body.season_number || !body.episode_number) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // ── 1. Find title UUID ─────────────────────────────────────────────────────
  const { data: titleRow } = await admin
    .from('titles')
    .select('id')
    .eq('tmdb_id', body.tmdb_show_id)
    .eq('media_type', 'tv')
    .single()

  if (!titleRow) return NextResponse.json({ success: true })
  const titleId: string = (titleRow as { id: string }).id

  // ── 2. Find season UUID ────────────────────────────────────────────────────
  const { data: seasonRow } = await admin
    .from('seasons')
    .select('id')
    .eq('title_id', titleId)
    .eq('season_number', body.season_number)
    .single()

  if (!seasonRow) return NextResponse.json({ success: true })
  const seasonId: string = (seasonRow as { id: string }).id

  // ── 3. Find episode UUID ───────────────────────────────────────────────────
  let episodeQuery = admin
    .from('episodes')
    .select('id')
    .eq('season_id', seasonId)
    .eq('episode_number', body.episode_number)

  if (body.episode_tmdb_id) {
    episodeQuery = episodeQuery.eq('tmdb_episode_id', body.episode_tmdb_id)
  }

  const { data: episodeRow } = await episodeQuery.single()
  if (!episodeRow) return NextResponse.json({ success: true })
  const episodeId: string = (episodeRow as { id: string }).id

  // ── 4. Soft-delete the log ─────────────────────────────────────────────────
  const { error } = await admin
    .from('user_logs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('title_id', titleId)
    .eq('log_type', 'tv_episode')
    .eq('season_id', seasonId)
    .eq('episode_id', episodeId)
    .is('deleted_at', null)

  if (error) {
    console.error('[logs/episode] delete error:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to remove log' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
