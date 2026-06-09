import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, Film, Layers, Play, Plus, Star, Tv, Zap } from 'lucide-react'

import { getGenres, getMovie, getPopularMovies, getTrending } from '@/lib/tmdb/client'
import {
  formatReleaseYear,
  formatRuntime,
  getBackdropUrl,
  getPosterUrl,
} from '@/lib/tmdb/helpers'
import type { TMDBSearchResult } from '@/types/tmdb'

// =============================================================================
// Sub-components (server-safe — pure CSS interactivity via Tailwind group-hover)
// =============================================================================

function PosterCard({
  item,
  genreMap,
}: {
  item: TMDBSearchResult
  genreMap: Map<number, string>
}) {
  const title = item.title ?? item.name ?? ''
  const date = item.release_date ?? item.first_air_date ?? ''
  const year = formatReleaseYear(date)
  const posterUrl = getPosterUrl(item.poster_path, 'md')
  const rating = item.vote_average ?? 0
  const firstGenreId = item.genre_ids?.[0]
  const genre = firstGenreId !== undefined ? genreMap.get(firstGenreId) : undefined

  return (
    <div className="flex-none w-40 md:w-52 snap-start group cursor-pointer">
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 group-hover:-translate-y-2 group-hover:shadow-gold-glow transition-all duration-500">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 160px, 208px"
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <Film className="w-10 h-10 text-outline" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-poster-overlay" />

        {/* Bookmark — appears on hover */}
        <button
          type="button"
          aria-label={`Save ${title}`}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <Bookmark className="w-3.5 h-3.5 text-white" />
        </button>

        {/* Bottom: year + star rating */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
          {year && (
            <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
              {year}
            </span>
          )}
          {rating > 0 && (
            <span className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-gold text-[10px] font-semibold px-1.5 py-0.5 rounded">
              <Star className="w-2.5 h-2.5 fill-gold stroke-none" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Below poster */}
      <p className="font-sans font-semibold text-sm truncate text-on-surface group-hover:text-gold transition-colors">
        {title}
      </p>
      <p className="text-on-surface-variant text-xs mt-0.5 truncate">
        {[year, genre].filter(Boolean).join(' • ')}
      </p>
    </div>
  )
}

function SectionHeader({ title, seeAllHref }: { title: string; seeAllHref: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="border-l-2 border-gold pl-4">
        <h2 className="font-display text-headline text-on-surface">{title}</h2>
      </div>
      <Link
        href={seeAllHref}
        className="text-label uppercase tracking-widest text-on-surface-variant hover:text-gold transition-colors"
      >
        See All
      </Link>
    </div>
  )
}

// =============================================================================
// Value props
// =============================================================================

const FEATURES = [
  {
    Icon: Layers,
    title: 'Film + TV, Unified',
    description:
      "One place for every movie you've seen and every episode you've watched. No app-switching, no compromise.",
  },
  {
    Icon: Tv,
    title: 'Episode-Level Tracking',
    description:
      'Log every season, every episode. Track exactly where you are in any series and never lose your place.',
  },
  {
    Icon: Zap,
    title: 'Free for Everyone',
    description:
      'All statistics, all insights, no paywalls. Great film tracking should be available to everyone.',
  },
] as const

// =============================================================================
// Page (Server Component — all data fetching is top-level await)
// =============================================================================

export default async function HomePage() {
  // Parallel fetches — independent of each other
  const [trendingMovies, popularMoviesData, trendingTV, allGenres] = await Promise.all([
    getTrending('movie', 'day'),
    getPopularMovies(),
    getTrending('tv', 'week'),
    getGenres(),
  ])

  // Hero needs full movie details (genres, runtime, vote count)
  const heroResult = trendingMovies[0]
  const heroFilm = await getMovie(heroResult.id)
  const heroBackdrop = getBackdropUrl(heroFilm.backdrop_path, 'lg')

  const genreMap = new Map(allGenres.map((g) => [g.id, g.name]))
  const inTheaters = popularMoviesData.results.slice(0, 16)
  const trendingTVShows = trendingTV.slice(0, 16)

  return (
    <>
      {/* ================================================================== */}
      {/* SECTION 1 — Cinematic Hero                                          */}
      {/* ================================================================== */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Full-bleed backdrop */}
        {heroBackdrop && (
          <Image
            src={heroBackdrop}
            alt={heroFilm.title}
            fill
            className="object-cover object-center"
            priority
          />
        )}

        {/* Gradient: opaque dark at bottom, transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141313] via-[#141313]/60 to-transparent" />

        {/* Content pinned to bottom */}
        <div className="absolute bottom-0 left-0 right-0 pb-16 md:pb-24">
          <div className="max-w-page mx-auto px-4 md:px-16 flex items-end justify-between gap-8">

            {/* ── Left: film info + CTAs ── */}
            <div className="max-w-2xl">
              {/* Metadata pills */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {heroFilm.genres?.slice(0, 3).map((g) => (
                  <span
                    key={g.id}
                    className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded"
                  >
                    {g.name}
                  </span>
                ))}
                {heroFilm.release_date && (
                  <span className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded">
                    {formatReleaseYear(heroFilm.release_date)}
                  </span>
                )}
                {heroFilm.runtime ? (
                  <span className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded">
                    {formatRuntime(heroFilm.runtime)}
                  </span>
                ) : null}
              </div>

              {/* Title */}
              <h1 className="font-display text-5xl md:text-7xl text-white tracking-tighter font-bold mb-4">
                {heroFilm.title}
              </h1>

              {/* Overview */}
              {heroFilm.overview && (
                <p className="text-on-surface-variant text-lg max-w-xl line-clamp-2 mb-8">
                  {heroFilm.overview}
                </p>
              )}

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="bg-gold text-black font-label uppercase font-bold px-8 py-3 rounded flex items-center gap-2 hover:bg-gold-hover active:scale-95 transition-all shadow-[0_4px_14px_0_rgba(212,175,55,0.39)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Trailer
                </button>
                <button
                  type="button"
                  className="bg-surface-container/60 backdrop-blur text-white font-label uppercase font-bold px-8 py-3 rounded border border-white/20 hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Watchlist
                </button>
              </div>
            </div>

            {/* ── Right: community rating card (desktop only) ── */}
            <div className="hidden md:block shrink-0">
              <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 text-center min-w-[148px]">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-2">
                  Community Rating
                </p>
                <p className="font-display text-4xl text-gold font-bold leading-none">
                  {heroFilm.vote_average.toFixed(1)}
                  <span className="font-sans text-sm text-on-surface-variant font-normal">/10</span>
                </p>
                <p className="text-[10px] text-on-surface-variant mt-2">
                  {heroFilm.vote_count.toLocaleString()} votes
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 2 — In Theaters (horizontal scroll)                        */}
      {/* ================================================================== */}
      <section className="py-12 md:py-16">
        <div className="max-w-page mx-auto px-4 md:px-16">
          <SectionHeader title="In Theaters" seeAllHref="/films" />
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
            {inTheaters.map((movie) => (
              <PosterCard key={movie.id} item={movie} genreMap={genreMap} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 3 — Trending TV (horizontal scroll)                        */}
      {/* ================================================================== */}
      <section className="py-12 md:py-16 bg-surface-container-lowest/60">
        <div className="max-w-page mx-auto px-4 md:px-16">
          <SectionHeader title="Trending TV" seeAllHref="/tv" />
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
            {trendingTVShows.map((show) => (
              <PosterCard key={show.id} item={show} genreMap={genreMap} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 4 — Why PictureBox (value props for logged-out users)      */}
      {/* ================================================================== */}
      <section className="py-20 md:py-28">
        <div className="max-w-page mx-auto px-4 md:px-16 text-center">
          <p className="text-label text-gold uppercase tracking-widest font-semibold mb-3">
            The Discerning Curator
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-on-surface tracking-tighter font-bold mb-4">
            Why PictureBox?
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto mb-16">
            Built for the people who take their watching seriously.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
            {FEATURES.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-full bg-gold-muted flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-xl font-bold text-on-surface mb-2">{title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="bg-gold text-black font-label uppercase tracking-widest font-bold px-8 py-3 rounded hover:bg-gold-hover active:scale-95 transition-all"
            >
              Start Tracking Free
            </Link>
            <Link
              href="/films"
              className="bg-surface-container/60 backdrop-blur text-white font-label uppercase tracking-widest font-bold px-8 py-3 rounded border border-white/20 hover:bg-white/10 active:scale-95 transition-all"
            >
              Browse Films
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 5 — Footer                                                 */}
      {/* ================================================================== */}
      <footer className="bg-surface-container-lowest border-t border-white/5 py-12">
        <div className="max-w-page mx-auto px-4 md:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <span className="font-display text-display-mobile text-on-surface tracking-tight">
              PictureBox
            </span>
            <p className="text-on-surface-variant text-sm text-center">
              © 2026 PictureBox. The Discerning Curator.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link
                href="/privacy"
                className="text-on-surface-variant text-sm hover:text-gold transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-on-surface-variant text-sm hover:text-gold transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-on-surface-variant text-sm hover:text-gold transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 text-center">
            <p className="text-outline text-xs">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
