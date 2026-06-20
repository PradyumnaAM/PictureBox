import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name || name.length > 100) {
    return NextResponse.json({ error: 'Name must be between 1 and 100 characters' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: group, error: groupError } = await admin
    .from('group_watchlists')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (groupError) {
    console.error('[groups/create] DB error:', groupError.code, groupError.message)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }

  await admin
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'owner', joined_at: new Date().toISOString() })

  return NextResponse.json({ group })
}
