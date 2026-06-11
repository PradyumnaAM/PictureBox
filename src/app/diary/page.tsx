import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Metadata } from 'next'

import NavbarWrapper from '@/components/layout/NavbarWrapper'
import { createAdminClient } from '@/lib/supabase/admin'
import DiaryClient, { type DiaryEntry } from './DiaryClient'

export const metadata: Metadata = {
  title: 'My Diary — PictureBox',
}

export default async function DiaryPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logs } = await (adminClient as any)
    .from('user_logs')
    .select('*, titles(*)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .not('status', 'eq', 'want_to_watch')
    .order('watched_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200)

  const entries = (logs ?? []) as DiaryEntry[]

  return (
    <>
      <NavbarWrapper />
      <div className="bg-background min-h-screen pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <h1 className="font-display text-4xl text-on-surface">My Diary</h1>
          <p className="text-on-surface-variant mt-1 mb-8">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </p>

          <DiaryClient entries={entries} />
        </div>
      </div>
    </>
  )
}
