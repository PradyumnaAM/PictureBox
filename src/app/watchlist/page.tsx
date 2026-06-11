import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Metadata } from 'next'

import NavbarWrapper from '@/components/layout/NavbarWrapper'
import { createAdminClient } from '@/lib/supabase/admin'
import WatchlistClient, { type WatchlistItem } from './WatchlistClient'

export const metadata: Metadata = {
  title: 'My Watchlist — PictureBox',
  description: 'Films and TV shows you want to watch.',
}

export default async function WatchlistPage() {
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
  const { data: watchlist } = await (adminClient as any)
    .from('user_logs')
    .select('*, titles(*)')
    .eq('user_id', user.id)
    .eq('status', 'want_to_watch')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const items = (watchlist ?? []) as WatchlistItem[]

  return (
    <>
      <NavbarWrapper />
      <div className="bg-background min-h-screen pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          <WatchlistClient items={items} />
        </div>
      </div>
    </>
  )
}
