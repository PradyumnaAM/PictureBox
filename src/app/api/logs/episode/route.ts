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

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // ── 1. Ensure the TV show exists in the titles table ─────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: titleRow, error: titleError } = await (admin as any)
    .from('titles')
    .upsert(
      { tmdb_id: body.tmdb_show_id, media_type: 'tv', title: '' },
      { onConflict: 'tmdb_id,media_type' },
    )
    .select('id')
    .single()

  if (titleError) {
    // If upsert fails (e.g., title is NOT NULL), try a plain select instead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: selectError } = await (admin as any)
      .from('titles')
      .select('id')
      .eq('tmdb_id', body.tmdb_show_id)
      .eq('media_type', 'tv')
      .single()

    if (selectError || !existing) {
      console.error('[logs/episode] title error:', titleError)
      return NextResponse.json({ error: 'Failed to resolve title' }, { status: 500 })
    }

    // Use existing title
    const titleId: string = (existing as { id: string }).id
    return await upsertEpisodeLog(admin, session.user.id, titleId, body, today)
  }

  const titleId: string = (titleRow as { id: string }).id
  return await upsertEpisodeLog(admin, session.user.id, titleId, body, today)
}

async function upsertEpisodeLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  titleId: string,
  body: { season_number: number; episode_tmdb_id: number },
  today: string,
) {
  const { error: logError } = await admin
    .from('user_logs')
    .upsert(
      {
        user_id: userId,
        title_id: titleId,
        log_type: 'tv_episode',
        status: 'watched',
        watched_at: today,
        season_id: body.season_number,
        episode_id: body.episode_tmdb_id,
      },
      { onConflict: 'user_id,title_id,season_id,episode_id,rewatch_count' },
    )
    .select()
    .single()

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

  const admin = createAdminClient()

  // ── 1. Find the title ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: titleRow } = await (admin as any)
    .from('titles')
    .select('id')
    .eq('tmdb_id', body.tmdb_show_id)
    .eq('media_type', 'tv')
    .single()

  if (!titleRow) {
    // Nothing to delete — title never logged
    return NextResponse.json({ success: true })
  }

  const titleId: string = (titleRow as { id: string }).id
  const deletedAt = new Date().toISOString()

  // ── 2. Soft-delete by episode_id if available, else by season + episode ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('user_logs')
    .update({ deleted_at: deletedAt })
    .eq('user_id', session.user.id)
    .eq('title_id', titleId)
    .eq('log_type', 'tv_episode')
    .eq('season_id', body.season_number)
    .is('deleted_at', null)

  if (body.episode_tmdb_id) {
    query = query.eq('episode_id', body.episode_tmdb_id)
  }

  const { error } = await query

  if (error) {
    console.error('[logs/episode] delete error:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to remove log' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
