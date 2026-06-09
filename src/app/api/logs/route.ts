import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogBody {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  release_date: string
  title_id?: string
  status: 'watched' | 'watching' | 'want_to_watch' | 'dropped'
  rating?: number | null
  review?: string | null
  watched_at?: string | null
  contains_spoilers?: boolean
  rewatch?: boolean
}

const VALID_STATUSES = new Set(['watched', 'watching', 'want_to_watch', 'dropped'])

// ─── POST /api/logs ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
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

  // Upsert title into the titles reference table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: titleRow, error: titleError } = await (admin as any)
    .from('titles')
    .upsert(
      {
        tmdb_id: body.tmdb_id,
        media_type: body.media_type,
        title: body.title ?? '',
        poster_path: body.poster_path ?? null,
        release_date: body.release_date ?? null,
      },
      { onConflict: 'tmdb_id,media_type' },
    )
    .select('id')
    .single()

  if (titleError) {
    console.error('[logs] title upsert error:', titleError)
    return NextResponse.json({ error: 'Failed to save title' }, { status: 500 })
  }

  const titleId: string = body.title_id ?? (titleRow as { id: string }).id

  // Upsert the user's log entry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logRow, error: logError } = await (admin as any)
    .from('user_logs')
    .upsert(
      {
        user_id: session.user.id,
        title_id: titleId,
        log_type: body.media_type,
        status: body.status,
        rating: body.rating ?? null,
        review: body.review ?? null,
        watched_at: body.watched_at ?? null,
        contains_spoilers: body.contains_spoilers ?? false,
        rewatch: body.rewatch ?? false,
      },
      { onConflict: 'user_id,title_id,season_id,episode_id,rewatch_count' },
    )
    .select()
    .single()

  if (logError) {
    console.error('[logs] log upsert error:', logError)
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }

  return NextResponse.json({ success: true, log: logRow })
}
