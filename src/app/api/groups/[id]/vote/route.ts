import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: groupId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { item_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.item_id) return NextResponse.json({ error: 'Missing item_id' }, { status: 400 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  // ── Authorization: the item must exist and the voter must be a member of the
  // group that owns it. Without this, any signed-in user could vote on items in
  // groups they don't belong to.
  const { data: item } = await adminAny
    .from('group_items')
    .select('group_id')
    .eq('id', body.item_id)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // Item must belong to the group named in the route.
  if ((item as { group_id: string }).group_id !== groupId) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const { data: membership } = await adminAny
    .from('group_members')
    .select('id')
    .eq('group_id', (item as { group_id: string }).group_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  // Check if a vote already exists (group_votes is keyed by group_item_id,
  // which is the group_items row id the client sends as item_id).
  const { data: existing } = await adminAny
    .from('group_votes')
    .select('id')
    .eq('group_item_id', body.item_id)
    .eq('user_id', user.id)
    .single()

  const alreadyVoted = Boolean(existing)

  // Toggle the user's vote row, then adjust the count atomically via RPC so
  // concurrent votes can't clobber each other.
  if (alreadyVoted) {
    await adminAny.from('group_votes').delete().eq('id', existing.id)
  } else {
    await adminAny
      .from('group_votes')
      .insert({ group_item_id: body.item_id, user_id: user.id })
  }

  const { error: rpcError } = await adminAny.rpc('increment_vote', {
    item_id: body.item_id,
    delta: alreadyVoted ? -1 : 1,
  })

  if (rpcError) {
    console.error('[groups/vote] increment_vote error:', rpcError)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }

  return NextResponse.json({ voted: !alreadyVoted })
}
