import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ProfileTabs, { type LogEntry } from '@/components/profile/ProfileTabs'
import FollowButton from '@/components/profile/FollowButton'
import Footer from '@/components/layout/Footer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ username: string }>
}

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  created_at: string
}

interface UserStats {
  total_movies: number
  total_episodes: number
  total_hours: number
  movies_this_year: number
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data } = await admin
    .from('profiles')
    .select('display_name, username')
    .eq('username', username)
    .single()
  if (!data) return { title: 'User not found — PictureBox' }
  const name = (data as Profile).display_name ?? (data as Profile).username
  return { title: `${name} — PictureBox` }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: profileData } = await admin
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profileData) notFound()

  const profile = profileData as Profile

  // Get auth user first so we can use their ID in follow queries
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    { data: statsData },
    { data: logsData },
    { count: followersCount },
    { count: followingCount },
    { data: isFollowingData },
  ] = await Promise.all([
    admin.rpc('get_user_stats', { p_user_id: profile.id }),
    admin
      .from('user_logs')
      .select('*, titles(*)')
      .eq('user_id', profile.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    admin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    admin
      .from('follows')
      .select('id')
      .eq('follower_id', user?.id ?? '')
      .eq('following_id', profile.id)
      .single(),
  ])

  const isOwnProfile = user?.id === profile.id
  const isFollowing = !!isFollowingData
  const stats = (Array.isArray(statsData) ? statsData[0] : statsData) as UserStats | null
  const logs = (logsData ?? []) as LogEntry[]

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const initial = (profile.display_name ?? profile.username)[0].toUpperCase()

  const statCards = [
    { label: 'Films Watched', value: stats?.total_movies      ?? 0 },
    { label: 'TV Episodes',   value: stats?.total_episodes    ?? 0 },
    { label: 'Hours Watched', value: `${stats?.total_hours    ?? 0}h` },
    { label: 'This Year',     value: `${stats?.movies_this_year ?? 0} films` },
  ]

  return (
    <div className="bg-background min-h-screen">

      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <div className="pt-28 pb-8 px-4 md:px-16 max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* Left: avatar + info */}
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
              <span className="font-display text-4xl font-bold text-black">{initial}</span>
            </div>

            {/* Text */}
            <div>
              <h1 className="font-display text-3xl text-on-surface">
                {profile.display_name ?? profile.username}
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">@{profile.username}</p>
              {profile.bio && (
                <p className="text-on-surface-variant mt-2 max-w-lg text-sm leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Follow counts */}
              <div className="flex gap-6 mt-3">
                <button type="button" className="text-left hover:opacity-80 transition-opacity">
                  <span className="font-semibold text-on-surface text-sm">
                    {followersCount ?? 0}
                  </span>{' '}
                  <span className="text-on-surface-variant text-sm">followers</span>
                </button>
                <button type="button" className="text-left hover:opacity-80 transition-opacity">
                  <span className="font-semibold text-on-surface text-sm">
                    {followingCount ?? 0}
                  </span>{' '}
                  <span className="text-on-surface-variant text-sm">following</span>
                </button>
              </div>

              <p className="text-on-surface-variant text-xs mt-2">Member since {memberSince}</p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex gap-3 flex-shrink-0 mt-2">
            {isOwnProfile ? (
              <Link
                href="/settings"
                className="bg-surface-container/60 backdrop-blur border border-white/20 text-on-surface font-label uppercase tracking-widest text-sm font-bold px-5 py-2.5 rounded hover:bg-white/10 transition-all active:scale-95"
              >
                Edit Profile
              </Link>
            ) : (
              <FollowButton
                targetUserId={profile.id}
                targetUsername={profile.username}
                initialIsFollowing={isFollowing}
                currentUserId={user?.id ?? null}
              />
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {statCards.map(({ label, value }) => (
            <div key={label} className="bg-surface-container rounded-xl p-5 text-center">
              <p className="font-display text-3xl text-gold">{value}</p>
              <p className="text-on-surface-variant text-xs uppercase tracking-widest mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-16 max-w-7xl mx-auto pb-16">
        <ProfileTabs logs={logs} />
      </div>

      <Footer />
    </div>
  )
}
