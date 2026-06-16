import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { getGenres, getTVShow, getTVSeason } from '@/lib/tmdb/client'
import { createClient } from '@/lib/supabase/server'
import {
  fetchCategoryResults,
  findCategory,
  toPosterItems,
} from '@/lib/tmdb/browse'
import CategoryView from '@/components/browse/CategoryView'
import TrackShowButton from '@/components/tv/TrackShowButton'
import WatchlistLikeButtons from '@/components/film/WatchlistLikeButtons'
import ReviewList, { type Review } from '@/components/film/ReviewList'
import {
  formatReleaseYear,
  getBackdropUrl,
  getPosterUrl,
  getProfileUrl,
  slugify,
} from '@/lib/tmdb/helpers'
import SeasonAccordion from '@/components/tv/SeasonAccordion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusStyle(status: string): string {
  if (status === 'Returning Series')
    return 'bg-green-500/20 text-green-400 border border-green-500/30'
  if (status === 'Cancelled' || status === 'Canceled')
    return 'bg-red-500/20 text-red-400 border border-red-500/30'
  return 'bg-surface-variant/80 text-on-surface border border-white/10'
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  // Browse category (e.g. /tv/trending-this-week) — slug is not an id-title show slug.
  const category = findCategory('tv', slug)
  if (category) {
    return {
      title: `${category.title} — TV Shows`,
      description: `${category.title} TV shows on PictureBox.`,
    }
  }

  const id = parseInt(slug.split('-')[0])
  try {
    const show = await getTVShow(id)
    const backdropUrl = getBackdropUrl(show.backdrop_path, 'lg')
    return {
      title: show.name,
      description: show.overview?.slice(0, 160),
      openGraph: {
        images: backdropUrl ? [backdropUrl] : [],
      },
    }
  } catch {
    return { title: 'Show not found' }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TVShowPage({ params }: PageProps) {
  const { slug } = await params

  // Browse category grid (e.g. /tv/trending-this-week) takes precedence over
  // the show-detail view, which expects an "{id}-{title}" slug.
  const category = findCategory('tv', slug)
  if (category) {
    const [genres, results] = await Promise.all([
      getGenres(),
      fetchCategoryResults(category),
    ])
    const genreMap = new Map(genres.map((g) => [g.id, g.name]))
    return (
      <CategoryView
        kicker="The Index · Television"
        title={category.title}
        items={toPosterItems(results, genreMap)}
        linkPrefix="/tv"
        backHref="/tv"
        backLabel="All Shows"
      />
    )
  }

  const tmdbId = parseInt(slug.split('-')[0])

  let show
  try {
    show = await getTVShow(tmdbId)
  } catch {
    notFound()
  }

  const [season1, supabase] = await Promise.all([
    getTVSeason(tmdbId, 1).catch(() => null),
    createClient(),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Per-user data (RLS-scoped): profile country, reviews, own log ─────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: titleRow } = await db
    .from('titles')
    .select('id')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', 'tv')
    .maybeSingle()
  const titleId: string | null = (titleRow as { id: string } | null)?.id ?? null

  let countryCode = 'US'
  if (user) {
    const { data: profile } = await db
      .from('profiles')
      .select('country_code')
      .eq('id', user.id)
      .maybeSingle()
    countryCode = (profile as { country_code: string | null } | null)?.country_code || 'US'
  }

  let reviews: Review[] = []
  if (titleId) {
    const { data: reviewRows } = await db
      .from('user_logs')
      .select(
        'id, rating, review, contains_spoilers, watched_at, created_at, profiles:user_id(username, display_name, avatar_url)',
      )
      .eq('title_id', titleId)
      .not('review', 'is', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    reviews = (reviewRows as Review[] | null) ?? []
  }

  let myLog: { id: string; status: string; liked: boolean } | null = null
  if (user && titleId) {
    const { data: logRow } = await db
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

  const backdropUrl = getBackdropUrl(show.backdrop_path, 'lg')

  const startYear = formatReleaseYear(show.first_air_date)
  const endYear =
    show.status === 'Ended' || show.status === 'Cancelled' || show.status === 'Canceled'
      ? formatReleaseYear(show.last_air_date)
      : 'present'
  const yearRange = startYear ? `${startYear}–${endYear}` : ''
  const networkName = show.networks?.[0]?.name ?? ''
  const networkYearStr = [networkName, yearRange].filter(Boolean).join(' • ')

  const creators = show.created_by ?? []
  const creatorStr = creators.map((c) => c.name).join(', ')

  const providerRegions = show['watch/providers']?.results ?? {}
  const region = providerRegions[countryCode] ?? providerRegions['US'] ?? null
  const providers = region?.flatrate ?? []
  const cast = show.credits?.cast.slice(0, 8) ?? []

  const regularSeasons = (show.seasons ?? []).filter((s) => s.season_number > 0)

  const trailerKey = show.videos?.results.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
  )?.key

  return (
    <>
      {/* ── Section 1: Hero ─────────────────────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt={show.name}
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
              <p className="font-mono text-xs text-cream/80 uppercase tracking-[0.14em] mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                {networkYearStr && <span>{networkYearStr}</span>}
                {show.genres?.slice(0, 3).map((g) => (
                  <span key={g.id} className="flex items-center gap-3">
                    <span className="text-ember">/</span>
                    {g.name}
                  </span>
                ))}
              </p>

              {/* Title */}
              <h1 className="font-display text-4xl md:text-6xl text-cream font-semibold tracking-tight leading-[1.04] mb-3">
                {show.name}
              </h1>

              {/* Tagline */}
              {show.tagline && (
                <p className="font-display italic text-on-surface-variant text-lg mb-2">
                  {show.tagline}
                </p>
              )}

              {/* Created by */}
              {creatorStr && (
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-on-surface-variant mb-4">
                  Created by <span className="text-cream">{creatorStr}</span>
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.12em] text-on-surface-variant mb-6">
                {show.number_of_seasons > 0 && (
                  <span>{show.number_of_seasons} Season{show.number_of_seasons !== 1 ? 's' : ''}</span>
                )}
                {show.number_of_episodes > 0 && (
                  <span>{show.number_of_episodes} Episodes</span>
                )}
                {show.status && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusStyle(show.status)}`}>
                    {show.status}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                {user && (
                  <>
                    <TrackShowButton
                      show={{
                        id: show.id,
                        name: show.name,
                        poster_path: show.poster_path,
                        first_air_date: show.first_air_date,
                      }}
                    />
                    <WatchlistLikeButtons
                      title={{
                        tmdb_id: show.id,
                        media_type: 'tv',
                        title: show.name,
                        poster_path: show.poster_path,
                        release_date: show.first_air_date || null,
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
                    className="bg-surface-container/60 backdrop-blur border border-white/20 text-white font-label uppercase font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                  >
                    ▶ Trailer
                  </a>
                )}
              </div>

              {!user && (
                <Link
                  href="/sign-in"
                  className="text-on-surface-variant text-sm hover:text-gold transition mt-3 inline-block"
                >
                  Sign in to track this show →
                </Link>
              )}
            </div>

            {/* Right: community rating (desktop only) */}
            <div className="hidden md:block shrink-0">
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg p-6 min-w-[200px] text-center">
                <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.16em] mb-2">
                  Rating
                </p>
                <p className="font-display text-5xl font-semibold text-ember leading-none">
                  {show.vote_average.toFixed(1)}
                </p>
                <p className="font-mono text-[10px] text-on-surface-variant mt-3">
                  {show.vote_count.toLocaleString()} votes
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
            <p className="text-on-surface-variant leading-relaxed">{show.overview}</p>

            {/* Seasons & Episodes */}
            {regularSeasons.length > 0 && (
              <>
                <h2 className="font-display text-2xl text-cream mb-6 mt-10">
                  Seasons &amp; Episodes
                </h2>
                <SeasonAccordion
                  showId={show.id}
                  seasons={regularSeasons}
                  initialSeason={season1}
                />
              </>
            )}

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

            {/* Reviews */}
            <h2 className="font-display text-2xl text-cream mb-4 mt-10">Reviews</h2>
            {reviews.length > 0 ? (
              <ReviewList reviews={reviews} />
            ) : (
              <div className="bg-surface-container rounded-xl p-8 text-center">
                <p className="text-on-surface-variant mb-4">No reviews yet. Be the first.</p>
                {!user && (
                  <Link
                    href="/sign-in"
                    className="text-on-surface-variant text-sm hover:text-gold transition"
                  >
                    Sign in to write a review
                  </Link>
                )}
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

            {/* Show Details */}
            <div className="bg-surface-container rounded-xl p-6 mt-6">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                {show.type && (
                  <>
                    <span className="text-on-surface-variant">Type</span>
                    <span className="text-on-surface">{show.type}</span>
                  </>
                )}
                {show.status && (
                  <>
                    <span className="text-on-surface-variant">Status</span>
                    <span className="text-on-surface">{show.status}</span>
                  </>
                )}
                {show.first_air_date && (
                  <>
                    <span className="text-on-surface-variant">First Aired</span>
                    <span className="text-on-surface">{show.first_air_date}</span>
                  </>
                )}
                {show.last_air_date && show.status !== 'Returning Series' && (
                  <>
                    <span className="text-on-surface-variant">Last Aired</span>
                    <span className="text-on-surface">{show.last_air_date}</span>
                  </>
                )}
                {(show.episode_run_time?.[0] ?? 0) > 0 && (
                  <>
                    <span className="text-on-surface-variant">Episode Runtime</span>
                    <span className="text-on-surface">{show.episode_run_time![0]} min</span>
                  </>
                )}
                {show.spoken_languages?.[0] && (
                  <>
                    <span className="text-on-surface-variant">Language</span>
                    <span className="text-on-surface">
                      {show.spoken_languages[0].iso_639_1.toUpperCase()}
                    </span>
                  </>
                )}
                {show.networks?.length > 0 && (
                  <>
                    <span className="text-on-surface-variant">Network</span>
                    <span className="text-on-surface">
                      {show.networks.map((n) => n.name).join(', ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* More Like This */}
            {(show.similar?.results.length ?? 0) > 0 && (
              <>
                <h3 className="font-display text-xl text-cream mb-4 mt-6">More Like This</h3>
                <div className="grid grid-cols-2 gap-3">
                  {show.similar!.results.slice(0, 4).map((item) => {
                    const itemName = item.name ?? item.title ?? ''
                    const itemPoster = getPosterUrl(item.poster_path, 'md')
                    const itemYear = formatReleaseYear(
                      item.first_air_date ?? item.release_date,
                    )
                    return (
                      <Link
                        key={item.id}
                        href={`/tv/${slugify(item.id, itemName)}`}
                        className="group"
                      >
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden w-full">
                          {itemPoster ? (
                            <Image
                              src={itemPoster}
                              alt={itemName}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="160px"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-on-surface mt-1 truncate group-hover:text-ember transition-colors">
                          {itemName}
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
