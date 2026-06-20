import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { invite_code: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.invite_code?.trim()) {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: group } = await admin
    .from('group_watchlists')
    .select('*')
    .eq('invite_code', body.invite_code.trim().toUpperCase())
    .single()

  if (!group) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
  }

  await admin
    .from('group_members')
    .upsert(
      { group_id: group.id, user_id: user.id, role: 'member', joined_at: new Date().toISOString() },
      { onConflict: 'group_id,user_id', ignoreDuplicates: true },
    )

  return NextResponse.json({ group })
}
