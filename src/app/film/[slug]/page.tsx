import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Plus } from 'lucide-react'

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const id = parseInt(slug.split('-')[0])
  const movie = await getMovie(id)
  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'lg')
  return {
    title: movie.title,
    description: movie.overview?.slice(0, 160),
    openGraph: {
      images: backdropUrl ? [backdropUrl] : [],
    },
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

  const [movie] = await Promise.all([
    getMovie(tmdbId),
    createClient(), // warm session in parallel; session used only for future per-user data
  ])

  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'lg')
  const year = formatReleaseYear(movie.release_date)

  const director = movie.credits?.crew.find((c) => c.job === 'Director')

  const trailerKey = movie.videos?.results.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
  )?.key

  const providers = movie['watch/providers']?.results?.US?.flatrate ?? []

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
              {/* Metadata pills */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {movie.genres?.slice(0, 3).map((g) => (
                  <span
                    key={g.id}
                    className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded"
                  >
                    {g.name}
                  </span>
                ))}
                {year && (
                  <span className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded">
                    {year}
                  </span>
                )}
                {movie.runtime > 0 && (
                  <span className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded">
                    {formatRuntime(movie.runtime)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-4xl md:text-6xl text-white font-bold tracking-tighter mb-2">
                {movie.title}
              </h1>

              {/* Tagline */}
              {movie.tagline && (
                <p className="italic text-on-surface-variant text-lg mb-2">{movie.tagline}</p>
              )}

              {/* Director */}
              {director && (
                <p className="text-on-surface-variant text-sm mb-6">
                  Directed by {director.name}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <LogButton movie={movieMeta} />
                <button
                  type="button"
                  className="bg-surface-container/60 backdrop-blur border border-white/20 text-white font-label uppercase font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Watchlist
                </button>
                <button
                  type="button"
                  className="bg-surface-container/60 backdrop-blur border border-white/20 text-white font-label uppercase font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                >
                  <Heart className="w-4 h-4" />
                  Like
                </button>
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
            </div>

            {/* Right: community rating (desktop only) */}
            <div className="hidden md:block shrink-0">
              <div className="bg-surface-container/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 min-w-[200px] text-center">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-2">
                  Community Rating
                </p>
                <p className="font-display text-5xl font-bold text-gold leading-none">
                  {movie.vote_average.toFixed(1)}
                  <span className="font-sans text-xl text-on-surface-variant font-normal">/10</span>
                </p>
                <p className="text-on-surface-variant text-sm mt-1">
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
            <h2 className="font-display text-xl text-on-surface mb-4">Overview</h2>
            <p className="text-on-surface-variant leading-relaxed">{movie.overview}</p>

            {/* Cast */}
            {cast.length > 0 && (
              <>
                <h2 className="font-display text-xl text-on-surface mb-4 mt-10">Cast</h2>
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
                <h2 className="font-display text-xl text-on-surface mb-4 mt-10">Crew</h2>
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

            {/* Reviews */}
            <h2 className="font-display text-xl text-on-surface mb-4 mt-10">Reviews</h2>
            <div className="bg-surface-container rounded-xl p-8 text-center">
              <p className="text-on-surface-variant mb-4">No reviews yet. Be the first.</p>
              <div className="flex justify-center">
                <LogButton movie={movieMeta} label="Log & Review" />
              </div>
            </div>

          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div className="md:col-span-4">

            {/* Where to Watch */}
            <h3 className="font-display text-lg text-on-surface mb-4">Where to Watch</h3>
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
                Not currently streaming in the US
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
                <h3 className="font-display text-lg text-on-surface mb-4 mt-6">More Like This</h3>
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
                        <p className="text-sm font-medium text-on-surface mt-1 truncate group-hover:text-gold transition-colors">
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
