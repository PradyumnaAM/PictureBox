import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cacheTitleOnLog } from '@/lib/tmdb/cache'
import { getMovie, getTVShow } from '@/lib/tmdb/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogBody {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  release_date: string | null
  overview?: string | null
  title_id?: string
  status:
    | 'watched'
    | 'watching'
    | 'want_to_watch'
    | 'dropped'
    | 'completed'
    | 'on_hold'
  rating?: number | null
  review?: string | null
  watched_at?: string | null
  contains_spoilers?: boolean
  rewatch?: boolean
}

const VALID_STATUSES = new Set([
  'watched',
  'watching',
  'want_to_watch',
  'dropped',
  'completed',
  'on_hold',
])

// ─── POST /api/logs ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check — getUser() revalidates the token with the Supabase auth server
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: LogBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate required fields
  if (
    typeof body.tmdb_id !== 'number' ||
    !body.media_type ||
    !body.status ||
    !VALID_STATUSES.has(body.status)
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // ── 1. Cache the title into the shared reference table ────────────────────
  // We store the FULL useful TMDB fields (runtime, genres, cast_crew with the
  // Director crew) — not just poster/title — so downstream stats (total hours,
  // favourite genres, favourite directors) have the data they need. The cache
  // helper fetches the full TMDB detail, reuses an already-complete cached row,
  // refreshes a row that's missing rich fields, and never overwrites a good row
  // with a blank one. A `fallback` (from the request body) is used only if the
  // TMDB detail fetch fails and nothing is cached yet.
  let titleRow: { id: string }
  try {
    titleRow = await cacheTitleOnLog({
      tmdbId: body.tmdb_id,
      mediaType: body.media_type,
      fetchDetail: (id) =>
        body.media_type === 'movie' ? getMovie(id) : getTVShow(id),
      fallback: {
        title: body.title ?? '',
        poster_path: body.poster_path ?? null,
        release_date: body.release_date || null,
        overview: body.overview ?? null,
      },
    })
  } catch (err) {
    console.error('[logs] title cache error:', err)
    return NextResponse.json(
      {
        error: 'Failed to save title',
        details: err instanceof Error ? err.message : 'unknown error',
      },
      { status: 500 },
    )
  }

  const titleId: string = body.title_id ?? titleRow.id

  // ── 2. Find-or-update the user's movie / show-level log entry ─────────────
  // The unique constraint on user_logs includes the nullable season_id and
  // episode_id columns. PostgreSQL treats NULL != NULL inside unique indexes,
  // so ON CONFLICT / upsert does NOT dedupe movie or show-level logs (where
  // both columns are NULL) — it just keeps inserting duplicates. We therefore
  // do an explicit find-or-update in code: look for the user's existing current
  // log for this title (season_id IS NULL AND episode_id IS NULL AND not soft-
  // deleted) and UPDATE it if present, otherwise INSERT. This guarantees one
  // current log per user+title.
  const logFields = {
    status:            body.status,
    rating:            body.rating            ?? null,
    review:            body.review            ?? null,
    watched_at:        body.watched_at        ?? null,
    contains_spoilers: body.contains_spoilers ?? false,
    rewatch:           body.rewatch           ?? false,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingLog, error: findError } = await (admin as any)
    .from('user_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('title_id', titleId)
    .is('season_id', null)
    .is('episode_id', null)
    .is('deleted_at', null)
    .maybeSingle()

  if (findError) {
    console.error('[logs] log lookup error:', JSON.stringify(findError, null, 2))
    return NextResponse.json(
      { error: 'Failed to save log', details: findError.message },
      { status: 500 },
    )
  }

  let logRow: unknown
  let logError: { message: string } | null = null

  if (existingLog) {
    // Update the user's existing current log for this title.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('user_logs')
      .update(logFields)
      .eq('id', (existingLog as { id: string }).id)
      .eq('user_id', user.id)
      .select()
      .single()
    logRow = data
    logError = error
  } else {
    // Insert a fresh log for this title.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('user_logs')
      .insert({
        user_id:  user.id,
        title_id: titleId,
        log_type: body.media_type === 'movie' ? 'movie' : 'tv_show',
        ...logFields,
      })
      .select()
      .single()
    logRow = data
    logError = error
  }

  if (logError) {
    console.error('[logs] log save error:', JSON.stringify(logError, null, 2))
    return NextResponse.json(
      { error: 'Failed to save log', details: logError.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, log: logRow })
}

// ─── DELETE /api/logs ─────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { log_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.log_id) {
    return NextResponse.json({ error: 'Missing log_id' }, { status: 400 })
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('user_logs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', body.log_id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
