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

  // Check if vote exists
  const { data: existing } = await adminAny
    .from('group_votes')
    .select('id')
    .eq('group_id', groupId)
    .eq('item_id', body.item_id)
    .eq('user_id', user.id)
    .single()

  // Fetch current count to update atomically
  const { data: currentItem } = await adminAny
    .from('group_items')
    .select('vote_count')
    .eq('id', body.item_id)
    .eq('group_id', groupId)
    .single()

  const currentCount = (currentItem as { vote_count: number } | null)?.vote_count ?? 0

  if (existing) {
    await Promise.all([
      adminAny.from('group_votes').delete().eq('id', existing.id),
      adminAny
        .from('group_items')
        .update({ vote_count: Math.max(0, currentCount - 1) })
        .eq('id', body.item_id)
        .eq('group_id', groupId),
    ])
    return NextResponse.json({ voted: false })
  }

  await Promise.all([
    adminAny
      .from('group_votes')
      .insert({ group_id: groupId, item_id: body.item_id, user_id: user.id }),
    adminAny
      .from('group_items')
      .update({ vote_count: currentCount + 1 })
      .eq('id', body.item_id)
      .eq('group_id', groupId),
  ])

  return NextResponse.json({ voted: true })
}
