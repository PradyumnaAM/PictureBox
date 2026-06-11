import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── POST /api/logs/episode ───────────────────────────────────────────────────
// Mark a specific episode as watched.

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    tmdb_show_id: number
    season_number: number
    episode_number: number
    episode_tmdb_id: number
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

  // ── 1. Resolve title UUID ──────────────────────────────────────────────────
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
  const { data: episodeRow, error: episodeError } = await admin
    .from('episodes')
    .upsert(
      {
        season_id: seasonId,
        episode_number: body.episode_number,
        tmdb_episode_id: body.episode_tmdb_id,
      },
      { onConflict: 'season_id,episode_number' },
    )
    .select('id')
    .single()

  if (episodeError || !episodeRow) {
    console.error('[logs/episode] episode upsert error:', episodeError)
    return NextResponse.json({ error: 'Failed to resolve episode' }, { status: 500 })
  }

  const episodeId: string = (episodeRow as { id: string }).id

  // ── 4. Upsert the watch log ────────────────────────────────────────────────
  const { error: logError } = await admin
    .from('user_logs')
    .upsert(
      {
        user_id: session.user.id,
        title_id: titleId,
        log_type: 'tv_episode',
        status: 'watched',
        watched_at: today,
        season_id: seasonId,
        episode_id: episodeId,
      },
      { onConflict: 'user_id,title_id,season_id,episode_id,rewatch_count' },
    )

  if (logError) {
    console.error('[logs/episode] log upsert error:', JSON.stringify(logError, null, 2))
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ─── DELETE /api/logs/episode ─────────────────────────────────────────────────
// Soft-delete the episode watch log.

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
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
    .eq('user_id', session.user.id)
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
