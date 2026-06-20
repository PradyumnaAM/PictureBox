import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LikeBody {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title?: string
  poster_path?: string | null
  release_date?: string | null
  liked: boolean
}

// ─── POST /api/logs/like ──────────────────────────────────────────────────────
// Toggles `user_logs.liked` for the signed-in user's log of a given title.
// If the user has no log for the title yet, one is created so the like can be
// stored. Uses the RLS client so writes are scoped to the authenticated user.
// Returns the resulting liked state.

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: LikeBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    typeof body.tmdb_id !== 'number' ||
    (body.media_type !== 'movie' && body.media_type !== 'tv') ||
    typeof body.liked !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // ── 1. Resolve (or create) the shared title row ───────────────────────────
  const { data: titleRow, error: titleError } = await supabase
    .from('titles')
    .upsert(
      {
        tmdb_id: body.tmdb_id,
        media_type: body.media_type,
        title: body.title ?? '',
        poster_path: body.poster_path ?? null,
        release_date: body.release_date || null,
      },
      { onConflict: 'tmdb_id,media_type' },
    )
    .select('id')
    .single()

  if (titleError || !titleRow) {
    return NextResponse.json(
      { error: titleError?.message ?? 'Failed to resolve title' },
      { status: 500 },
    )
  }

  const titleId: string = (titleRow as { id: string }).id

  // ── 2. Find the user's existing (non-deleted) log for this title ──────────
  const { data: existing } = await supabase
    .from('user_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('title_id', titleId)
    .is('season_id', null)
    .is('episode_id', null)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('user_logs')
      .update({ liked: body.liked })
      .eq('id', (existing as { id: string }).id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, liked: body.liked })
  }

  // ── 3. No log yet — create a minimal one carrying just the like ───────────
  const { error: insertError } = await supabase.from('user_logs').insert({
    user_id: user.id,
    title_id: titleId,
    log_type: body.media_type === 'movie' ? 'movie' : 'tv_show',
    status: 'want_to_watch',
    liked: body.liked,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, liked: body.liked })
}
