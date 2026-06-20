import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'

import { getMovie } from '@/lib/tmdb/client'
import { createClient } from '@/lib/supabase/server'
import {
  getBackdropUrl,
  getPosterUrl,
  getProfileUrl,
  formatRuntime,
  formatReleaseYear,
  slugify,
} from '@/lib/tmdb/helpers'
import LogButton from '@/components/film/LogButton'
import WatchlistLikeButtons from '@/components/film/WatchlistLikeButtons'
import ReviewList, { type Review } from '@/components/film/ReviewList'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const id = parseInt(slug.split('-')[0])
  try {
    const movie = await getMovie(id)
    const backdropUrl = getBackdropUrl(movie.backdrop_path, 'lg')
    return {
      title: movie.title,
      description: movie.overview?.slice(0, 160),
      openGraph: {
        images: backdropUrl ? [backdropUrl] : [],
      },
    }
  } catch {
    return { title: 'Film not found' }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  return `$${(n / 1_000).toFixed(0)}K`
}

const KEY_CREW_JOBS = [
  { role: 'Director', job: 'Director' },
  { role: 'Director of Photography', job: 'Director of Photography' },
  { role: 'Music', job: 'Original Music Composer' },
  { role: 'Editor', job: 'Editor' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FilmPage({ params }: PageProps) {
  const { slug } = await params
  const tmdbId = parseInt(slug.split('-')[0])

  let movie
  try {
    movie = await getMovie(tmdbId)
  } catch {
    notFound()
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Per-user data (RLS-scoped): profile country, reviews, own log ─────────

  // Resolve the shared title row for this TMDB id so we can find logs/reviews.
  const { data: titleRow } = await supabase
    .from('titles')
    .select('id')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', 'movie')
    .maybeSingle()
  const titleId: string | null = (titleRow as { id: string } | null)?.id ?? null

  // Signed-in user's country for streaming-provider region selection.
  let countryCode = 'US'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('country_code')
      .eq('id', user.id)
      .maybeSingle()
    countryCode = (profile as { country_code: string | null } | null)?.country_code || 'US'
  }

  // Reviews for this title (RLS limits to viewable rows: own + public/followed).
  let reviews: Review[] = []
  if (titleId) {
    const { data: reviewRows } = await supabase
      .from('user_logs')
      .select(
        'id, rating, review, contains_spoilers, watched_at, created_at, profiles:user_id(username, display_name, avatar_url)',
      )
      .eq('title_id', titleId)
      // Include rating-only entries, not just written reviews, so a user's
      // rating shows even when they didn't write anything.
      .or('review.not.is.null,rating.not.is.null')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    reviews = (reviewRows as Review[] | null) ?? []
  }

  // The signed-in user's own (non-deleted) log for this title — drives buttons.
  let myLog: { id: string; status: string; liked: boolean } | null = null
  if (user && titleId) {
    const { data: logRow } = await supabase
      .from('user_logs')
      .select('id, status, liked')
      .eq('user_id', user.id)
      .eq('title_id', titleId)
      .is('season_id', null)
      .is('episode_id', null)
      .is('deleted_at', null)
      .maybeSingle()
    myLog = (logRow as { id: string; status: string; liked: boolean } | null) ?? null
  }

  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'lg')
  const year = formatReleaseYear(movie.release_date)

  const director = movie.credits?.crew.find((c) => c.job === 'Director')

  const trailerKey = movie.videos?.results.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
  )?.key

  // Streaming providers for the user's region, falling back to US.
  const providerRegions = movie['watch/providers']?.results ?? {}
  const region =
    providerRegions[countryCode] ?? providerRegions['US'] ?? null
  const providers = region?.flatrate ?? []

  const cast = movie.credits?.cast.slice(0, 8) ?? []

  const keyCrew = KEY_CREW_JOBS.flatMap(({ role, job }) => {
    const member = movie.credits?.crew.find((c) => c.job === job)
    return member ? [{ role, member }] : []
  })

  const movieMeta = {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
  }

  return (
    <>
      {/* ── Section 1: Hero ─────────────────────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover"
            style={{ objectPosition: 'center 20%' }}
            sizes="100vw"
          />
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 pb-12 px-4 md:px-16">
          <div className="max-w-7xl mx-auto flex items-end justify-between gap-8">

            {/* Left: info + CTAs */}
            <div className="flex-1 min-w-0">
              {/* Timecode metadata line */}
              <p className="mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs uppercase tracking-[0.12em] text-cream/75">
                {year && <span>{year}</span>}
                {movie.runtime > 0 && (
                  <>
                    <span className="text-ember/70">·</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </>
                )}
                {movie.genres?.slice(0, 3).map((g) => (
                  <span key={g.id} className="flex items-center gap-2.5">
                    <span className="text-ember/70">·</span>
                    {g.name}
                  </span>
                ))}
              </p>

              {/* Title */}
              <h1 className="mb-3 font-display text-3xl font-semibold leading-[0.98] tracking-tight text-cream sm:text-4xl md:text-7xl">
                {movie.title}
              </h1>

              {/* Rating — mobile only (desktop version is in the right column) */}
              <div className="flex items-center gap-2 mb-3 md:hidden">
                <span className="font-mono text-2xl font-semibold text-ember">
                  {movie.vote_average.toFixed(1)}
                </span>
                <span className="text-on-surface-variant text-xs">/ 10 · {movie.vote_count.toLocaleString()} votes</span>
              </div>

              {/* Tagline */}
              {movie.tagline && (
                <p className="mb-2 font-display text-lg italic text-on-surface-variant">
                  {movie.tagline}
                </p>
              )}

              {/* Director */}
              {director && (
                <p className="mb-6 font-mono text-xs uppercase tracking-[0.12em] text-on-surface-variant">
                  Directed by <span className="text-cream">{director.name}</span>
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                {user && (
                  <>
                    <LogButton movie={movieMeta} />
                    <WatchlistLikeButtons
                      title={{
                        tmdb_id: movie.id,
                        media_type: 'movie',
                        title: movie.title,
                        poster_path: movie.poster_path,
                        release_date: movie.release_date || null,
                      }}
                      isLoggedIn={!!user}
                      initialOnWatchlist={myLog?.status === 'want_to_watch'}
                      initialLiked={myLog?.liked ?? false}
                      initialLogId={myLog?.id ?? null}
                    />
                  </>
                )}
                {trailerKey && (
                  <a
                    href={`https://youtube.com/watch?v=${trailerKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="surface-frost flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 font-sans text-sm font-semibold text-cream transition-all hover:border-ember hover:text-ember active:scale-95"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Trailer
                  </a>
                )}
              </div>

              {!user && (
                <Link
                  href="/sign-in"
                  className="mt-3 inline-block text-sm text-on-surface-variant transition hover:text-ember"
                >
                  Sign in to track this film
                </Link>
              )}
            </div>

            {/* Right: community rating (desktop only) */}
            <div className="hidden shrink-0 md:block">
              <div className="surface-frost min-w-[180px] rounded-2xl border border-white/10 p-6 text-center">
                <p className="mb-2 font-label text-label uppercase text-on-surface-variant">
                  Rating
                </p>
                <p className="font-mono text-5xl font-semibold leading-none text-ember">
                  {movie.vote_average.toFixed(1)}
                </p>
                <p className="mt-3 font-mono text-[10px] text-on-surface-variant">
                  {movie.vote_count.toLocaleString()} votes
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 2: Main content ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* ── Left column ──────────────────────────────────────────────── */}
          <div className="md:col-span-8">

            {/* Overview */}
            <h2 className="font-display text-2xl text-cream mb-4">Overview</h2>
            <p className="text-on-surface-variant leading-relaxed">{movie.overview}</p>

            {/* Cast */}
            {cast.length > 0 && (
              <>
                <h2 className="font-display text-2xl text-cream mb-4 mt-10">Cast</h2>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                  {cast.map((member) => {
                    const photo = getProfileUrl(member.profile_path)
                    return (
                      <div key={member.credit_id} className="flex-none w-24 text-center">
                        <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-surface-container flex items-center justify-center">
                          {photo ? (
                            <Image
                              src={photo}
                              alt={member.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl text-on-surface-variant font-bold">
                              {member.name[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-on-surface mt-2 line-clamp-2">
                          {member.name}
                        </p>
                        <p className="text-xs text-on-surface-variant line-clamp-1">
                          {member.character}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Key Crew */}
            {keyCrew.length > 0 && (
              <>
                <h2 className="font-display text-2xl text-cream mb-4 mt-10">Crew</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {keyCrew.map(({ role, member }) => (
                    <div key={role} className="bg-surface-container rounded-lg p-4">
                      <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">
                        {role}
                      </p>
                      <p className="text-on-surface font-medium">{member.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Ratings & Reviews */}
            <h2 className="font-display text-2xl text-cream mb-4 mt-10">Ratings &amp; Reviews</h2>
            {reviews.length > 0 ? (
              <ReviewList reviews={reviews} />
            ) : (
              <div className="bg-surface-container rounded-xl p-8 text-center">
                <p className="text-on-surface-variant mb-4">No ratings or reviews yet. Be the first.</p>
                <div className="flex justify-center">
                  {user ? (
                    <LogButton movie={movieMeta} label="Log & Review" />
                  ) : (
                    <Link
                      href="/sign-in"
                      className="text-on-surface-variant text-sm hover:text-gold transition"
                    >
                      Sign in to write a review
                    </Link>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div className="md:col-span-4">

            {/* Where to Watch */}
            <h3 className="font-display text-xl text-cream mb-4">Where to Watch</h3>
            {providers.length > 0 ? (
              <div>
                {providers.map((provider) => (
                  <div key={provider.provider_id} className="flex items-center gap-3 mb-3">
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                      alt={provider.provider_name}
                      width={40}
                      height={40}
                      className="rounded-lg"
                    />
                    <span className="text-on-surface text-sm">{provider.provider_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant text-sm">
                Not currently streaming in your region
              </p>
            )}

            {/* Film Details */}
            <div className="bg-surface-container rounded-xl p-6 mt-6">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                {movie.original_title &&
                  movie.original_title !== movie.title &&
                  /^[\x00-\x7F]*$/.test(movie.original_title) && (
                  <>
                    <span className="text-on-surface-variant">Original Title</span>
                    <span className="text-on-surface break-words">{movie.original_title}</span>
                  </>
                )}
                {movie.status && (
                  <>
                    <span className="text-on-surface-variant">Status</span>
                    <span className="text-on-surface">{movie.status}</span>
                  </>
                )}
                {movie.release_date && (
                  <>
                    <span className="text-on-surface-variant">Release Date</span>
                    <span className="text-on-surface">{movie.release_date}</span>
                  </>
                )}
                {movie.runtime > 0 && (
                  <>
                    <span className="text-on-surface-variant">Runtime</span>
                    <span className="text-on-surface">{formatRuntime(movie.runtime)}</span>
                  </>
                )}
                {movie.spoken_languages?.[0] && (
                  <>
                    <span className="text-on-surface-variant">Language</span>
                    <span className="text-on-surface">
                      {movie.spoken_languages[0].iso_639_1.toUpperCase()}
                    </span>
                  </>
                )}
                {movie.budget > 0 && (
                  <>
                    <span className="text-on-surface-variant">Budget</span>
                    <span className="text-on-surface">{formatMoney(movie.budget)}</span>
                  </>
                )}
                {movie.revenue > 0 && (
                  <>
                    <span className="text-on-surface-variant">Revenue</span>
                    <span className="text-on-surface">{formatMoney(movie.revenue)}</span>
                  </>
                )}
              </div>
            </div>

            {/* More Like This */}
            {(movie.similar?.results.length ?? 0) > 0 && (
              <>
                <h3 className="font-display text-xl text-cream mb-4 mt-6">More Like This</h3>
                <div className="grid grid-cols-2 gap-3">
                  {movie.similar!.results.slice(0, 4).map((item) => {
                    const itemTitle = item.title ?? ''
                    const itemPoster = getPosterUrl(item.poster_path, 'md')
                    const itemYear = formatReleaseYear(item.release_date)
                    return (
                      <Link
                        key={item.id}
                        href={`/film/${slugify(item.id, itemTitle)}`}
                        className="group"
                      >
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden w-full">
                          {itemPoster ? (
                            <Image
                              src={itemPoster}
                              alt={itemTitle}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="160px"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-on-surface mt-1 truncate group-hover:text-ember transition-colors">
                          {itemTitle}
                        </p>
                        {itemYear && (
                          <p className="text-xs text-on-surface-variant">{itemYear}</p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

