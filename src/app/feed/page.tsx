import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Image from 'next/image'
import Link from 'next/link'
import { Film, Star, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Metadata } from 'next'

import { getPosterUrl, slugify, formatReleaseYear } from '@/lib/tmdb/helpers'

export const metadata: Metadata = {
  title: 'Activity Feed — PictureBox',
  description: 'See what people you follow are watching.',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TitleData {
  id: string
  tmdb_id: number
  media_type: string
  title: string
  poster_path: string | null
  release_date: string | null
}

interface ProfileData {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface FeedLog {
  id: string
  user_id: string
  log_type: string
  status: string
  rating: number | null
  review: string | null
  created_at: string
  titles: TitleData | TitleData[] | null
  profiles: ProfileData | ProfileData[] | null
}

interface WatchingLog {
  id: string
  titles: TitleData | TitleData[] | null
}

interface UserStats {
  total_movies: number
  total_episodes: number
  total_hours: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveTitle(log: FeedLog | WatchingLog): TitleData | null {
  if (!log.titles) return null
  return Array.isArray(log.titles) ? (log.titles[0] ?? null) : log.titles
}

function resolveProfile(log: FeedLog): ProfileData | null {
  if (!log.profiles) return null
  return Array.isArray(log.profiles) ? (log.profiles[0] ?? null) : log.profiles
}

function getInitial(profile: ProfileData): string {
  return ((profile.display_name ?? profile.username)[0] ?? '?').toUpperCase()
}

function actionText(log: FeedLog, titleName: string): string {
  if (log.status === 'watched') {
    const ratingStr = log.rating != null ? ` ★ ${log.rating}` : ''
    return `watched ${titleName}${ratingStr}`
  }
  if (log.status === 'watching') return `is watching ${titleName}`
  return `added ${titleName} to their watchlist`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n
        const half = !full && rating >= n - 0.5
        return (
          <div key={n} className="relative w-3 h-3 flex-shrink-0">
            <Star className="absolute inset-0 w-3 h-3 text-on-surface-variant/25" />
            {full && <Star className="absolute inset-0 w-3 h-3 fill-ember text-ember" />}
            {half && (
              <Star
                className="absolute inset-0 w-3 h-3 fill-ember text-ember"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FeedCard({ log }: { log: FeedLog }) {
  const title = resolveTitle(log)
  const profile = resolveProfile(log)
  if (!title || !profile) return null

  const posterUrl = getPosterUrl(title.poster_path, 'sm')
  const detailHref =
    title.media_type === 'movie'
      ? `/film/${slugify(title.tmdb_id, title.title)}`
      : `/tv/${slugify(title.tmdb_id, title.title)}`
  const year = formatReleaseYear(title.release_date)
  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
  const action = actionText(log, title.title)

  return (
    <div className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-5 mb-4">
      {/* User row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-8 h-8 rounded-full bg-ember text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
          {getInitial(profile)}
        </div>
        <div className="flex items-center gap-1 flex-wrap text-sm">
          <Link
            href={`/u/${profile.username}`}
            className="font-semibold text-on-surface hover:text-ember transition-colors"
          >
            {profile.display_name ?? profile.username}
          </Link>
          <span className="text-on-surface-variant">{action}</span>
        </div>
        <span className="ml-auto text-on-surface-variant text-xs flex-shrink-0">{timeAgo}</span>
      </div>

      {/* Detail row */}
      <div className="flex gap-4 mt-4">
        {/* Poster */}
        <Link href={detailHref} className="flex-shrink-0">
          <div className="relative w-12 h-16 rounded overflow-hidden bg-surface-container-high">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={title.title}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="text-on-surface-variant" size={14} />
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={detailHref}
            className="font-semibold text-sm text-on-surface hover:text-ember transition-colors"
          >
            {title.title}
          </Link>
          <p className="text-on-surface-variant text-xs mt-0.5">
            {[year, title.media_type === 'movie' ? 'Film' : 'TV Show']
              .filter(Boolean)
              .join(' • ')}
          </p>
          {log.rating != null && (
            <div className="mt-1.5">
              <StarDisplay rating={log.rating} />
            </div>
          )}
          {log.review && (
            <p className="text-on-surface-variant text-sm mt-2 line-clamp-2 leading-relaxed">
              {log.review}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FeedPage() {
  // Auth
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

  // RLS client: follows are world-readable, user_logs/profiles policies expose
  // own + followed/public rows — everything this feed needs without service role.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Fetch follows + feed + stats + watching in parallel
  const [
    { data: following },
    { data: statsData },
    { data: watching },
  ] = await Promise.all([
    db
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id),
    db.rpc('get_user_stats', { p_user_id: user.id }),
    db
      .from('user_logs')
      .select('*, titles(*)')
      .eq('user_id', user.id)
      .eq('status', 'watching')
      .eq('log_type', 'tv_show')
      .is('deleted_at', null)
      .limit(3),
  ])

  const followingIds: string[] = (following ?? []).map(
    (f: { following_id: string }) => f.following_id,
  )
  const allUserIds = [...followingIds, user.id]

  const { data: feedLogs } = await db
    .from('user_logs')
    .select('*, titles(*), profiles:user_id(id, username, display_name, avatar_url)')
    .in('user_id', allUserIds)
    .is('deleted_at', null)
    .in('status', ['watched', 'watching'])
    .order('created_at', { ascending: false })
    .limit(50)

  const logs = (feedLogs ?? []) as FeedLog[]
  const watchingShows = (watching ?? []) as WatchingLog[]
  const stats = (Array.isArray(statsData) ? statsData[0] : statsData) as UserStats | null
  const hasFollows = followingIds.length > 0

  return (
    <div className="bg-background min-h-screen pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Main feed ─────────────────────────────────────────────────── */}
            <main className="lg:col-span-8">
              <header className="mb-10">
                <p className="flex items-center gap-3 font-label text-label uppercase text-ember mb-3">
                  <span aria-hidden className="w-6 h-px bg-ember/50" />
                  The Reel · Live
                </p>
                <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-cream leading-none">
                  Activity
                </h1>
              </header>

              {/* Empty state — no follows */}
              {!hasFollows && (
                <div className="flex flex-col items-center text-center mt-16">
                  <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
                    <Users size={28} className="text-on-surface-variant opacity-40" />
                  </div>
                  <p className="text-on-surface font-semibold text-lg">Nothing here yet.</p>
                  <p className="text-on-surface-variant text-sm mt-1">
                    Follow people to see their activity.
                  </p>
                  <Link
                    href="/members"
                    className="mt-6 bg-ember text-black font-label uppercase tracking-widest text-sm font-bold px-6 py-2.5 rounded hover:bg-ember-hover active:scale-95 transition-all"
                  >
                    Find people to follow
                  </Link>
                </div>
              )}

              {/* Feed items */}
              {hasFollows && logs.length === 0 && (
                <p className="text-on-surface-variant text-sm text-center mt-16">
                  No recent activity yet. Check back soon!
                </p>
              )}

              {hasFollows && logs.map((log) => (
                <FeedCard key={log.id} log={log} />
              ))}
            </main>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <aside className="hidden lg:block lg:col-span-4">

              {/* Your Stats */}
              <div className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-5">
                <h2 className="font-display text-base text-on-surface mb-4">Your Stats</h2>
                <div className="space-y-4">
                  <div>
                    <p className="font-display text-2xl text-ember">{stats?.total_movies ?? 0}</p>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.16em] mt-1">
                      Films Watched
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl text-ember">{stats?.total_episodes ?? 0}</p>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.16em] mt-1">
                      Episodes Watched
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl text-ember">{stats?.total_hours ?? 0}h</p>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.16em] mt-1">
                      Hours Watched
                    </p>
                  </div>
                </div>
              </div>

              {/* Continue Watching */}
              {watchingShows.length > 0 && (
                <div className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-5 mt-4">
                  <h2 className="font-display text-base text-on-surface mb-4">Continue Watching</h2>
                  <div className="space-y-3">
                    {watchingShows.map((log) => {
                      const title = resolveTitle(log)
                      if (!title) return null
                      const posterUrl = getPosterUrl(title.poster_path, 'sm')
                      const href = `/tv/${slugify(title.tmdb_id, title.title)}`
                      return (
                        <div key={log.id} className="flex items-center gap-3">
                          <Link href={href} className="flex-shrink-0">
                            <div className="relative w-10 h-14 rounded overflow-hidden bg-surface-container-high">
                              {posterUrl ? (
                                <Image
                                  src={posterUrl}
                                  alt={title.title}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Film className="text-on-surface-variant" size={12} />
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-on-surface font-medium truncate">
                              {title.title}
                            </p>
                            <Link
                              href={href}
                              className="text-xs text-ember hover:text-ember-hover transition-colors mt-0.5 inline-block"
                            >
                              Continue →
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Suggested */}
              <div className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-5 mt-4">
                <h2 className="font-display text-base text-on-surface mb-3">Suggested</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Follow friends to build your feed.
                </p>
                <Link
                  href="/members"
                  className="text-ember text-sm hover:text-ember-hover transition-colors mt-3 inline-block"
                >
                  Find people →
                </Link>
              </div>

            </aside>
          </div>
        </div>
      </div>
  )
}
