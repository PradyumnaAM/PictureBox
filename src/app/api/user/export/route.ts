import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [{ data: profile }, { data: logs }, { data: lists }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('lists').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
  ])

  const listIds = ((lists ?? []) as { id: string }[]).map((l) => l.id)
  const { data: listItems } = listIds.length
    ? await supabase.from('list_items').select('*').in('list_id', listIds)
    : { data: [] }

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile ?? null,
    user_logs: logs ?? [],
    lists: lists ?? [],
    list_items: listItems ?? [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="picturebox-export.json"',
    },
  })
}
