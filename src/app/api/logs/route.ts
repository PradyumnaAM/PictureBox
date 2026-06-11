import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogBody {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  release_date: string | null
  overview?: string | null
  title_id?: string
  status: 'watched' | 'watching' | 'want_to_watch' | 'dropped'
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
  // ── DEBUG ──────────────────────────────────────────────────────────────────
  const testAdmin = createAdminClient()
  const { data: testData, error: testError } = await testAdmin
    .from('titles')
    .select('count')
    .limit(1)
  console.log('ADMIN CLIENT TEST:', { testData, testError })
  console.log('SERVICE KEY EXISTS:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('SERVICE KEY PREFIX:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30))
  console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  // ── END DEBUG ──────────────────────────────────────────────────────────────

  // Guard: service role key must be present before doing anything
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[logs] SUPABASE_SERVICE_ROLE_KEY is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  // Auth check — uses anon+session client so RLS applies to the session check
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
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

  // ── 1. Upsert the title into the shared reference table ───────────────────
  // release_date is a DATE column — coerce empty strings to null so Postgres
  // doesn't reject them (TMDB returns "" for unreleased/undated films).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: titleRow, error: titleError } = await (admin as any)
    .from('titles')
    .upsert(
      {
        tmdb_id:      body.tmdb_id,
        media_type:   body.media_type,
        title:        body.title ?? '',
        poster_path:  body.poster_path  ?? null,
        release_date: body.release_date || null,   // || coerces "" → null
        overview:     body.overview     ?? null,
      },
      { onConflict: 'tmdb_id,media_type' },
    )
    .select('id')
    .single()

  if (titleError) {
    console.error('[logs] title upsert error:', JSON.stringify(titleError, null, 2))
    return NextResponse.json(
      { error: 'Failed to save title', details: titleError.message },
      { status: 500 },
    )
  }

  const titleId: string = body.title_id ?? (titleRow as { id: string }).id

  // ── 2. Upsert the user's log entry ────────────────────────────────────────
  // The unique constraint is (user_id, title_id, season_id, episode_id, rewatch_count).
  // For movies, season_id and episode_id are NULL. PostgreSQL treats NULL != NULL
  // inside unique constraints, so the conflict clause won't match an existing row
  // via NULL columns. We work around this by using ignoreDuplicates:false and
  // handling the case where the user already has a log for this title by doing
  // a select-then-upsert pattern until a proper partial index is added.
  // For now we attempt the upsert and surface the real error if it fails.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logRow, error: logError } = await (admin as any)
    .from('user_logs')
    .upsert(
      {
        user_id:           session.user.id,
        title_id:          titleId,
        log_type:          body.media_type === 'movie' ? 'movie' : 'tv_show',
        status:            body.status,
        rating:            body.rating            ?? null,
        review:            body.review            ?? null,
        watched_at:        body.watched_at        ?? null,
        contains_spoilers: body.contains_spoilers ?? false,
        rewatch:           body.rewatch           ?? false,
      },
      { onConflict: 'user_id,title_id,season_id,episode_id,rewatch_count' },
    )
    .select()
    .single()

  if (logError) {
    console.error('[logs] log upsert error:', JSON.stringify(logError, null, 2))
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
