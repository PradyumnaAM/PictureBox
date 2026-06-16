import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'

import { createAdminClient } from '@/lib/supabase/admin'
import CreateGroupModal from '@/components/groups/CreateGroupModal'
import JoinGroupModal from '@/components/groups/JoinGroupModal'

export const metadata: Metadata = {
  title: 'Group Watchlists — PictureBox',
}

interface GroupWatchlist {
  id: string
  name: string
  invite_code: string
  created_by: string
}

interface Membership {
  id: string
  group_id: string
  role: string
  joined_at: string
  group_watchlists: GroupWatchlist | null
}

export default async function GroupsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  const { data: membershipsData } = await adminAny
    .from('group_members')
    .select('*, group_watchlists(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const memberships = (membershipsData ?? []) as Membership[]
  const groups = memberships
    .map((m) => m.group_watchlists)
    .filter((g): g is GroupWatchlist => g !== null)

  // Fetch member counts for all groups in one query
  const groupIds = groups.map((g) => g.id)
  const { data: memberRows } = groupIds.length > 0
    ? await adminAny.from('group_members').select('group_id').in('group_id', groupIds)
    : { data: [] }

  const memberCountMap: Record<string, number> = {}
  for (const row of (memberRows ?? []) as { group_id: string }[]) {
    memberCountMap[row.group_id] = (memberCountMap[row.group_id] ?? 0) + 1
  }

  return (
    <div className="bg-background min-h-screen pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-cream">Group Watchlists</h1>
              <p className="text-on-surface-variant mt-1">Watch together. Decide together.</p>
            </div>
            <div className="flex gap-3 mt-1">
              <CreateGroupModal />
              <JoinGroupModal />
            </div>
          </div>

          {/* Empty state */}
          {groups.length === 0 && (
            <div className="flex flex-col items-center mt-20 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <Users size={32} className="text-on-surface-variant opacity-40" />
              </div>
              <p className="text-on-surface font-semibold text-lg">No groups yet.</p>
              <p className="text-on-surface-variant text-sm mt-1 max-w-xs">
                Create a group with friends to decide what to watch together.
              </p>
              <div className="mt-6">
                <CreateGroupModal />
              </div>
            </div>
          )}

          {/* Groups grid */}
          {groups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const memberCount = memberCountMap[group.id] ?? 0
                return (
                  <div
                    key={group.id}
                    className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-5"
                  >
                    <h2 className="font-display text-2xl text-cream truncate">{group.name}</h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </p>

                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                      <span className="bg-surface-container-high px-3 py-1 rounded-full font-mono text-sm text-ember">
                        Code: {group.invite_code}
                      </span>
                      <Link
                        href={`/groups/${group.id}`}
                        className="ml-auto bg-ember text-black font-label uppercase tracking-widest text-xs font-bold px-4 py-1.5 rounded hover:bg-ember-hover active:scale-95 transition-all"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
  )
}
