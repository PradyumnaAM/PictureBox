import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import type { Metadata } from 'next'

import FollowButton from '@/components/profile/FollowButton'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Discover People — PictureBox',
  description: 'Find friends and fellow cinephiles on PictureBox.',
}

interface Member {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  created_at: string
}

export default async function MembersPage() {
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

  // RLS client: profiles_select exposes public profiles (plus self/followed),
  // which is exactly what a member directory should list.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [{ data: membersData }, { data: myFollowsData }] = await Promise.all([
    db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
    // Fetch all IDs the current user already follows (one query, no N+1)
    user
      ? db
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const members = (membersData ?? []) as Member[]
  const followingSet = new Set<string>(
    ((myFollowsData ?? []) as { following_id: string }[]).map((f) => f.following_id),
  )

  return (
    <>
      <div className="bg-background min-h-screen pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-iris-gradient font-display text-3xl md:text-4xl font-semibold tracking-tight">Discover People</h1>
            <p className="text-on-surface-variant mt-1">
              Find friends and fellow cinephiles.
            </p>
          </div>

          {/* Grid */}
          {members.length === 0 ? (
            <p className="text-on-surface-variant text-sm text-center mt-16">
              No members yet. Be the first!
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member) => {
                const initial = (
                  (member.display_name ?? member.username)[0] ?? '?'
                ).toUpperCase()

                return (
                  <div
                    key={member.id}
                    className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-4 flex flex-col gap-3"
                  >
                    {/* Avatar + name */}
                    <Link
                      href={`/u/${member.username}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-ember flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-lg font-semibold text-black">
                          {initial}
                        </span>
                      </div>
                      <div className="min-w-0">
                        {member.display_name && (
                          <p className="text-sm font-semibold text-on-surface truncate group-hover:text-ember transition-colors">
                            {member.display_name}
                          </p>
                        )}
                        <p className="text-xs text-on-surface-variant truncate">
                          @{member.username}
                        </p>
                      </div>
                    </Link>

                    {/* Bio snippet */}
                    {member.bio && (
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {member.bio}
                      </p>
                    )}

                    {/* Follow button */}
                    <div className="mt-auto pt-1">
                      <FollowButton
                        targetUserId={member.id}
                        targetUsername={member.username}
                        initialIsFollowing={followingSet.has(member.id)}
                        currentUserId={user?.id ?? null}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

