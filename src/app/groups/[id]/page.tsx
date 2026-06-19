import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Metadata } from 'next'

import { createAdminClient } from '@/lib/supabase/admin'
import GroupItemsList, { type GroupItem } from '@/components/groups/GroupItemsList'
import AddToGroupSearch from '@/components/groups/AddToGroupSearch'

interface PageProps {
  params: Promise<{ id: string }>
}

interface GroupWatchlist {
  id: string
  name: string
  invite_code: string
  created_by: string
}

interface GroupMember {
  id: string
  user_id: string
  role: string
  profiles: {
    id: string
    username: string
    display_name: string | null
  } | null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).from('group_watchlists').select('name').eq('id', id).single()
  const name = (data as GroupWatchlist | null)?.name ?? 'Group Watchlist'
  return { title: `${name} — PictureBox` }
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id: groupId } = await params

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

  // Verify membership
  const { data: membership } = await adminAny
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  const [
    { data: groupData },
    { data: itemsData },
    { data: membersData },
    { data: userVotesData },
  ] = await Promise.all([
    adminAny.from('group_watchlists').select('*').eq('id', groupId).single(),
    adminAny
      .from('group_items')
      .select('*, titles(*)')
      .eq('group_id', groupId)
      .eq('watched', false)
      .order('vote_count', { ascending: false }),
    adminAny
      .from('group_members')
      .select('*, profiles:user_id(id, username, display_name)')
      .eq('group_id', groupId),
    adminAny
      .from('group_votes')
      .select('group_item_id')
      .eq('user_id', user.id),
  ])

  if (!groupData) notFound()

  const group = groupData as GroupWatchlist
  const items = (itemsData ?? []) as GroupItem[]
  const members = (membersData ?? []) as GroupMember[]
  const votedItemIds = ((userVotesData ?? []) as { group_item_id: string }[]).map((v) => v.group_item_id)

  const displayMembers = members.slice(0, 5)
  const extraCount = Math.max(0, members.length - 5)

  return (
    <div className="bg-background min-h-screen pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-iris-gradient font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3">{group.name}</h1>

            {/* Member avatars */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {displayMembers.map((member) => {
                  const initial = (
                    (member.profiles?.display_name ?? member.profiles?.username ?? '?')[0] ?? '?'
                  ).toUpperCase()
                  return (
                    <div
                      key={member.id}
                      title={member.profiles?.display_name ?? member.profiles?.username}
                      className="w-8 h-8 rounded-full bg-ember text-black text-xs font-bold flex items-center justify-center border-2 border-background"
                    >
                      {initial}
                    </div>
                  )
                })}
                {extraCount > 0 && (
                  <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold flex items-center justify-center border-2 border-background">
                    +{extraCount}
                  </div>
                )}
              </div>
              <span className="text-on-surface-variant text-sm">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
              </div>

              {/* Invite code — always on its own row on mobile */}
              <span className="font-mono text-sm text-ember bg-surface-container px-3 py-1 rounded-full self-start sm:ml-auto">
                Invite friends: {group.invite_code}
              </span>
            </div>

            {/* Add title search */}
            <div className="mt-6">
              <AddToGroupSearch groupId={groupId} />
            </div>
          </div>

          {/* Items list */}
          <GroupItemsList
            items={items}
            groupId={groupId}
            currentUserId={user.id}
            initialVotedItemIds={votedItemIds}
          />

        </div>
      </div>
  )
}

