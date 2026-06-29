import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
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
  // RLS client: public profiles are visible to everyone, private ones to
  // their owner and followers — exactly the visibility this page should have.
  const db = await createClient()
  const { data } = await db
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
  // All queries go through the RLS client — profiles_select / follows_select /
  // user_logs_select policies grant exactly the rows this page may show.
  const db = supabase

  const { data: profileData } = await db
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
    db.rpc('get_user_stats', { p_user_id: profile.id }),
    db
      .from('user_logs')
      .select('*, titles(*)')
      .eq('user_id', profile.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    db
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    db
      .from('follows')
      .select('id')
      .eq('follower_id', user?.id ?? '')
      .eq('following_id', profile.id)
      .single(),
  ])

  const isOwnProfile = user?.id === profile.id
  const isFollowing = !!isFollowingData
  const stats = (Array.isArray(statsData) ? statsData[0] : statsData) as UserStats | null
  const logs = (logsData ?? []) as unknown as LogEntry[]

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
            {/* Avatar — projected frame */}
            <div className="relative w-24 h-24 rounded-xl bg-gradient-to-br from-surface-container-highest to-surface-container border border-white/10 flex items-center justify-center flex-shrink-0 shadow-poster">
              <span className="font-display text-4xl font-semibold text-ember">{initial}</span>
              <span aria-hidden className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-ember border-2 border-background" />
            </div>

            {/* Text */}
            <div>
              <h1 className="text-iris-gradient font-display text-3xl md:text-4xl font-semibold tracking-tight">
                {profile.display_name ?? profile.username}
              </h1>
              <p className="font-mono text-xs text-on-surface-variant mt-1.5">@{profile.username}</p>
              {profile.bio && (
                <p className="text-on-surface-variant mt-2 max-w-lg text-sm leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Follow counts — each opens the matching people list */}
              <div className="flex gap-6 mt-3">
                <Link
                  href={`/u/${profile.username}/followers`}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <span className="font-semibold text-on-surface text-sm">
                    {followersCount ?? 0}
                  </span>{' '}
                  <span className="text-on-surface-variant text-sm">followers</span>
                </Link>
                <Link
                  href={`/u/${profile.username}/following`}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <span className="font-semibold text-on-surface text-sm">
                    {followingCount ?? 0}
                  </span>{' '}
                  <span className="text-on-surface-variant text-sm">following</span>
                </Link>
              </div>

              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-outline mt-2.5">
                Member since {memberSince}
              </p>
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

        {/* Stats strip — one filmstrip-style band, divided like frames */}
        <div className="grid grid-cols-2 md:grid-cols-4 mt-10 rounded-xl overflow-hidden border border-white/[0.07] bg-surface-container-low divide-x divide-y md:divide-y-0 divide-white/[0.06]">
          {statCards.map(({ label, value }, i) => (
            <div key={label} className="relative p-6 text-center group hover:bg-surface-container transition-colors">
              <span aria-hidden className="absolute top-3 left-4 font-mono text-[10px] text-outline">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="font-display text-3xl md:text-4xl font-semibold text-cream group-hover:text-ember transition-colors">
                {value}
              </p>
              <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.16em] mt-2">
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

