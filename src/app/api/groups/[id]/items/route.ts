import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

interface AddItemBody {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  release_date: string | null
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: groupId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // Verify membership
  const { data: membership } = await adminAny
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })

  let body: AddItemBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.tmdb_id || !body.media_type || !body.title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Upsert the title into the shared reference table
  const { data: titleRow, error: titleError } = await adminAny
    .from('titles')
    .upsert(
      {
        tmdb_id: body.tmdb_id,
        media_type: body.media_type,
        title: body.title,
        poster_path: body.poster_path ?? null,
        release_date: body.release_date || null,
      },
      { onConflict: 'tmdb_id,media_type' },
    )
    .select('id')
    .single()

  if (titleError) return NextResponse.json({ error: titleError.message }, { status: 500 })

  const { data: item, error: itemError } = await adminAny
    .from('group_items')
    .insert({
      group_id: groupId,
      title_id: (titleRow as { id: string }).id,
      added_by: user.id,
      watched: false,
      vote_count: 0,
    })
    .select('*, titles(*)')
    .single()

  if (itemError) {
    if (itemError.code === '23505') {
      return NextResponse.json({ error: 'Already in this group watchlist' }, { status: 409 })
    }
    return NextResponse.json({ error: itemError.message }, { status: 500 })
  }

  return NextResponse.json({ item })
}
