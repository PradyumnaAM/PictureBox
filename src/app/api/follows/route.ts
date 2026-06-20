import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// Follows go through the RLS client: follows_insert / follows_delete policies
// already restrict rows to follower_id = auth.uid(), so no service-role
// bypass is needed.

// ─── POST /api/follows ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { following_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.following_id) {
    return NextResponse.json({ error: 'Missing following_id' }, { status: 400 })
  }

  if (body.following_id === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const { error } = await supabase
    .from('follows')
    .upsert(
      { follower_id: user.id, following_id: body.following_id },
      { onConflict: 'follower_id,following_id', ignoreDuplicates: true },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// ─── DELETE /api/follows ──────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { following_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.following_id) {
    return NextResponse.json({ error: 'Missing following_id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', body.following_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
