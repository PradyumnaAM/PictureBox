import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

const USERNAME_RE = /^[a-z0-9_]{3,30}$/i

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[GET /api/user/profile] DB error:', error.code, error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Build validated update patch — only include fields that are present in body
  const patch: Record<string, unknown> = {}

  if ('display_name' in body) {
    const v = body.display_name
    if (v !== null && (typeof v !== 'string' || v.length > 50)) {
      return NextResponse.json({ error: 'display_name must be a string ≤ 50 chars' }, { status: 400 })
    }
    patch.display_name = v
  }

  if ('username' in body) {
    const v = body.username
    if (typeof v !== 'string' || !USERNAME_RE.test(v)) {
      return NextResponse.json(
        { error: 'username must be 3–30 characters: letters, numbers, underscores only' },
        { status: 400 },
      )
    }
    patch.username = v.toLowerCase()
  }

  if ('bio' in body) {
    const v = body.bio
    if (v !== null && (typeof v !== 'string' || v.length > 300)) {
      return NextResponse.json({ error: 'bio must be a string ≤ 300 chars' }, { status: 400 })
    }
    patch.bio = v
  }

  if ('country_code' in body) {
    const v = body.country_code
    if (v !== null && (typeof v !== 'string' || !/^[A-Z]{2}$/.test(v))) {
      return NextResponse.json({ error: 'country_code must be a 2-letter ISO code' }, { status: 400 })
    }
    patch.country_code = v
  }

  if ('streaming_services' in body) {
    const v = body.streaming_services
    if (!Array.isArray(v) || !v.every((x) => typeof x === 'number' && Number.isInteger(x))) {
      return NextResponse.json({ error: 'streaming_services must be an array of integers' }, { status: 400 })
    }
    patch.streaming_services = v
  }

  if ('favorite_genres' in body) {
    const v = body.favorite_genres
    if (!Array.isArray(v)) {
      return NextResponse.json({ error: 'favorite_genres must be an array' }, { status: 400 })
    }
    patch.favorite_genres = v
  }

  if ('profile_public' in body) {
    if (typeof body.profile_public !== 'boolean') {
      return NextResponse.json({ error: 'profile_public must be a boolean' }, { status: 400 })
    }
    patch.profile_public = body.profile_public
  }

  if ('spoiler_free_mode' in body) {
    if (typeof body.spoiler_free_mode !== 'boolean') {
      return NextResponse.json({ error: 'spoiler_free_mode must be a boolean' }, { status: 400 })
    }
    patch.spoiler_free_mode = body.spoiler_free_mode
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // RLS client: profiles_update policy restricts the update to the user's own
  // row, so no service-role bypass is needed here.
  const { error } = await supabase
    .from('profiles')
    .update(patch as unknown as ProfileUpdate)
    .eq('id', user.id)

  if (error) {
    console.error('[PATCH /api/user/profile] DB error:', error.code, error.message)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }
    if (error.code === '42501') {
      return NextResponse.json({ error: 'Missing database grant — apply the fix_role_grants migration in the Supabase SQL editor.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}