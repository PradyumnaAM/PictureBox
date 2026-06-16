import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_STATUSES = new Set([
  'watched',
  'watching',
  'want_to_watch',
  'dropped',
  'completed',
  'on_hold',
])

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { log_id: string; status: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.log_id || !body.status || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Build the update. When a log transitions into a "watched"/"completed"
  // state we also stamp watched_at (date-only) so diary dates and yearly
  // stats are correct instead of falling back to created_at. We never
  // clobber an existing watched_at.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { status: body.status }

  if (body.status === 'watched' || body.status === 'completed') {
    // Only set watched_at if it isn't already set on the existing row.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin as any)
      .from('user_logs')
      .select('watched_at')
      .eq('id', body.log_id)
      .eq('user_id', user.id)
      .single()

    if (!existing?.watched_at) {
      update.watched_at = new Date().toISOString().slice(0, 10)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('user_logs')
    .update(update)
    .eq('id', body.log_id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
